const Equipment = require('../models/Equipment');
const Tyre = require('../models/Tyre');
const Inspection = require('../models/Inspection');
const Maintenance = require('../models/Maintenance');
const { getTenantScope, resolveTenantCompanyId } = require('../middleware/authMiddleware');
const { runAlertScan } = require('../services/alertEngine');

// Helper to increment operating hours for Active equipment based on system time
const syncOperatingHours = async () => {
  try {
    const now = new Date();
    const activeEquipment = await Equipment.find({ status: 'Active' });

    for (const eq of activeEquipment) {
      const lastTime = eq.lastActiveTime || eq.updatedAt || eq.createdAt || now;
      const elapsedMs = now.getTime() - new Date(lastTime).getTime();

      if (elapsedMs > 0) {
        const elapsedHours = elapsedMs / (1000 * 60 * 60);
        if (elapsedHours >= 0.0001) {
          const currentHours = Number(eq.operatingHours) || 0;
          eq.operatingHours = Math.round((currentHours + elapsedHours) * 100) / 100;
          eq.lastActiveTime = now;
          await eq.save();
        }
      } else {
        eq.lastActiveTime = now;
        await eq.save();
      }
    }
  } catch (error) {
    console.error('[Operating Hours Sync Error]:', error.message);
  }
};

// @desc    Get all equipment with search & filters (Scoped to Tenant)
// @route   GET /api/equipment
// @access  Private
const getEquipment = async (req, res, next) => {
  try {
    // Sync active operating hours with system time
    await syncOperatingHours();

    const { search, type, status, healthStatus, siteId, sort } = req.query;
    
    // Inject multi-tenant isolation
    const tenantFilter = getTenantScope(req);
    const query = { ...tenantFilter };

    // Field Technicians view only their assigned equipment (or all company equipment if none yet assigned)
    if (req.user && req.user.role === 'TECHNICIAN') {
      const assignedCount = await Equipment.countDocuments({ ...tenantFilter, assignedTechnicianId: req.user._id });
      if (assignedCount > 0) {
        query.assignedTechnicianId = req.user._id;
      }
    }

    if (type && type !== 'All') query.type = type;
    if (status && status !== 'All') query.status = status;
    if (healthStatus && healthStatus !== 'All') query.healthStatus = healthStatus;
    if (siteId && siteId !== 'All') query.siteId = siteId;

    if (search) {
      query.$and = query.$and || [];
      query.$and.push({
        $or: [
          { equipmentId: { $regex: search, $options: 'i' } },
          { name: { $regex: search, $options: 'i' } },
          { manufacturer: { $regex: search, $options: 'i' } },
          { model: { $regex: search, $options: 'i' } },
          { serialNumber: { $regex: search, $options: 'i' } }
        ]
      });
    }

    let sortOption = { createdAt: -1 };
    if (sort === 'hours_desc') sortOption = { operatingHours: -1 };
    if (sort === 'hours_asc') sortOption = { operatingHours: 1 };
    if (sort === 'id_asc') sortOption = { equipmentId: 1 };

    const equipmentList = await Equipment.find(query)
      .populate('siteId')
      .populate('companyId')
      .populate('assignedTechnicianId', 'name email role')
      .sort(sortOption);

    // Attach mounted tyres count or details
    const enrichedList = await Promise.all(
      equipmentList.map(async (eq) => {
        const mountedTyres = await Tyre.find({ equipmentId: eq._id });
        return {
          ...eq.toObject(),
          mountedTyres
        };
      })
    );

    res.json({ success: true, count: enrichedList.length, data: enrichedList });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single equipment by ID (with tyres, inspections & work orders)
// @route   GET /api/equipment/:id
// @access  Private
const getEquipmentById = async (req, res, next) => {
  try {
    await syncOperatingHours();
    const tenantFilter = getTenantScope(req);
    const equipment = await Equipment.findOne({ _id: req.params.id, ...tenantFilter })
      .populate('siteId')
      .populate('companyId');

    if (!equipment) {
      return res.status(404).json({ success: false, message: 'Equipment not found or access denied' });
    }

    const tyres = await Tyre.find({ equipmentId: equipment._id });
    const recentInspections = await Inspection.find({ equipmentId: equipment._id })
      .populate('technicianId', 'name email')
      .sort({ inspectionDate: -1 })
      .limit(5);

    const activeMaintenance = await Maintenance.find({
      equipmentId: equipment._id,
      status: { $in: ['Scheduled', 'In Progress', 'Assigned', 'Overdue'] }
    }).populate('assignedTechnicianId', 'name');

    res.json({
      success: true,
      data: {
        ...equipment.toObject(),
        tyres,
        recentInspections,
        activeMaintenance
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new heavy machinery equipment
// @route   POST /api/equipment
// @access  Private (Owner, Maintenance Manager, Super Admin)
const createEquipment = async (req, res, next) => {
  try {
    const companyId = resolveTenantCompanyId(req);
    if (!companyId) {
      return res.status(400).json({ success: false, message: 'Company assignment is required' });
    }

    // Check duplicate equipmentId within the same company
    const existing = await Equipment.findOne({
      companyId,
      equipmentId: req.body.equipmentId?.toUpperCase()
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: `Equipment ID '${req.body.equipmentId}' already exists in your fleet`
      });
    }

    const equipment = await Equipment.create({
      ...req.body,
      companyId,
      equipmentId: req.body.equipmentId.toUpperCase()
    });

    const populated = await Equipment.findById(equipment._id).populate('siteId').populate('companyId');

    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    next(error);
  }
};

// @desc    Update equipment details
// @route   PUT /api/equipment/:id
// @access  Private
const updateEquipment = async (req, res, next) => {
  try {
    const tenantFilter = getTenantScope(req);
    let equipment = await Equipment.findOne({ _id: req.params.id, ...tenantFilter });

    if (!equipment) {
      return res.status(404).json({ success: false, message: 'Equipment not found or access denied' });
    }

    // Do not allow changing immutable fields across updates
    delete req.body.companyId;
    delete req.body.equipmentId;
    delete req.body.name; // remove name of equipment from update
    delete req.body.type; // remove type of equipment from update

    // Synchronize operating hours and active status transitions using system time
    const now = new Date();
    if (req.body.status) {
      if (req.body.status === 'Active' && equipment.status !== 'Active') {
        req.body.lastActiveTime = now;
      } else if (req.body.status !== 'Active' && equipment.status === 'Active') {
        if (equipment.lastActiveTime) {
          const elapsedHours = (now.getTime() - new Date(equipment.lastActiveTime).getTime()) / (1000 * 60 * 60);
          if (elapsedHours > 0) {
            const currentHours = Number(req.body.operatingHours !== undefined ? req.body.operatingHours : equipment.operatingHours) || 0;
            req.body.operatingHours = Math.round((currentHours + elapsedHours) * 100) / 100;
          }
        }
        req.body.lastActiveTime = null;
      }
    }

    equipment = await Equipment.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    }).populate('siteId').populate('companyId');

    // Run background alert trigger if health status changed to warning/critical
    if (req.body.healthStatus && req.body.healthStatus !== 'Good') {
      runAlertScan().catch(() => {});
    }

    res.json({ success: true, data: equipment });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete / decommission equipment
// @route   DELETE /api/equipment/:id
// @access  Private (Owner, Super Admin)
const deleteEquipment = async (req, res, next) => {
  try {
    const tenantFilter = getTenantScope(req);
    const equipment = await Equipment.findOne({ _id: req.params.id, ...tenantFilter });

    if (!equipment) {
      return res.status(404).json({ success: false, message: 'Equipment not found or access denied' });
    }

    // Unmount any active tyres safely
    await Tyre.updateMany(
      { equipmentId: equipment._id },
      { $set: { equipmentId: null, position: 'Unassigned', status: 'Spare / Inventory' } }
    );

    await Equipment.findByIdAndDelete(equipment._id);

    res.json({ success: true, message: 'Equipment and tyre associations decommissioned successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  syncOperatingHours,
  getEquipment,
  getEquipmentById,
  createEquipment,
  updateEquipment,
  deleteEquipment
};

const Tyre = require('../models/Tyre');
const Equipment = require('../models/Equipment');
const { getTenantScope, resolveTenantCompanyId } = require('../middleware/authMiddleware');
const { runAlertScan } = require('../services/alertEngine');

// @desc    Get all tyres with search and filters (Tenant Scoped)
// @route   GET /api/tyres
// @access  Private
const getTyres = async (req, res, next) => {
  try {
    const { search, condition, status, brand, equipmentId, position } = req.query;
    const tenantFilter = getTenantScope(req);
    const query = { ...tenantFilter };

    // Field Technicians view only their assigned tyres (or all company tyres if none yet assigned)
    if (req.user && req.user.role === 'TECHNICIAN') {
      const assignedCount = await Tyre.countDocuments({ ...tenantFilter, assignedTechnicianId: req.user._id });
      if (assignedCount > 0) {
        query.assignedTechnicianId = req.user._id;
      }
    }

    if (condition && condition !== 'All') query.condition = condition;
    if (status && status !== 'All') query.status = status;
    if (brand && brand !== 'All') query.brand = brand;
    if (position && position !== 'All') query.position = position;

    if (equipmentId) {
      if (equipmentId === 'unassigned') {
        query.equipmentId = null;
      } else if (equipmentId !== 'All') {
        query.equipmentId = equipmentId;
      }
    }

    if (search) {
      query.$and = query.$and || [];
      query.$and.push({
        $or: [
          { tyreId: { $regex: search, $options: 'i' } },
          { brand: { $regex: search, $options: 'i' } },
          { model: { $regex: search, $options: 'i' } },
          { size: { $regex: search, $options: 'i' } }
        ]
      });
    }

    const tyres = await Tyre.find(query)
      .populate('equipmentId', 'equipmentId name type status')
      .populate('siteId', 'name location')
      .populate('companyId', 'name code')
      .populate('assignedTechnicianId', 'name email role')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: tyres.length, data: tyres });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single tyre by ID
// @route   GET /api/tyres/:id
// @access  Private
const getTyreById = async (req, res, next) => {
  try {
    const tenantFilter = getTenantScope(req);
    const tyre = await Tyre.findOne({ _id: req.params.id, ...tenantFilter })
      .populate('equipmentId')
      .populate('siteId')
      .populate('companyId');

    if (!tyre) {
      return res.status(404).json({ success: false, message: 'Tyre not found or access denied' });
    }

    res.json({ success: true, data: tyre });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new tyre
// @route   POST /api/tyres
// @access  Private (Owner, Maintenance Manager, Super Admin)
const createTyre = async (req, res, next) => {
  try {
    const companyId = resolveTenantCompanyId(req);
    if (!companyId) {
      return res.status(400).json({ success: false, message: 'Company assignment is required' });
    }

    const {
      tyreId,
      brand,
      model,
      size,
      initialTreadDepth,
      currentTreadDepth,
      standardPressure,
      currentPressure,
      currentTemperature,
      status,
      siteId,
      cost,
      notes
    } = req.body;

    const existing = await Tyre.findOne({ companyId, tyreId: tyreId.toUpperCase() });
    if (existing) {
      return res.status(400).json({ success: false, message: `Tyre with ID '${tyreId}' already exists in your inventory` });
    }

    const tyre = await Tyre.create({
      companyId,
      tyreId: tyreId.toUpperCase(),
      brand,
      model,
      size,
      initialTreadDepth: Number(initialTreadDepth),
      currentTreadDepth: Number(currentTreadDepth || initialTreadDepth),
      standardPressure: Number(standardPressure || 102),
      currentPressure: Number(currentPressure || standardPressure || 102),
      currentTemperature: Number(currentTemperature || 65),
      status: status || 'Spare / Inventory',
      siteId: siteId || null,
      cost: Number(cost || 45000),
      notes: notes || ''
    });

    await runAlertScan().catch(() => {});

    res.status(201).json({ success: true, data: tyre });
  } catch (error) {
    next(error);
  }
};

// @desc    Update tyre details/pressure/tread
// @route   PUT /api/tyres/:id
// @access  Private
const updateTyre = async (req, res, next) => {
  try {
    const tenantFilter = getTenantScope(req);
    const tyre = await Tyre.findOne({ _id: req.params.id, ...tenantFilter });
    if (!tyre) {
      return res.status(404).json({ success: false, message: 'Tyre not found or access denied' });
    }

    // Disable updating brand and type/model/size/serial
    delete req.body.companyId;
    delete req.body.tyreId;
    delete req.body.brand;
    delete req.body.model;
    delete req.body.size;

    Object.assign(tyre, req.body);
    await tyre.save();

    await runAlertScan().catch(() => {});

    res.json({ success: true, data: tyre });
  } catch (error) {
    next(error);
  }
};

// @desc    Mount or Swap Tyre on Equipment Position
// @route   POST /api/tyres/:id/mount
// @access  Private (Technician, Manager, Owner, Super Admin)
const mountTyre = async (req, res, next) => {
  try {
    const tenantFilter = getTenantScope(req);
    const { equipmentId, position, reason } = req.body;
    const tyre = await Tyre.findOne({ _id: req.params.id, ...tenantFilter });

    if (!tyre) {
      return res.status(404).json({ success: false, message: 'Tyre not found or access denied' });
    }

    // Action: Unmount if equipmentId is null
    if (!equipmentId || equipmentId === 'unassigned') {
      if (tyre.equipmentId) {
        tyre.replacementHistory.push({
          equipmentId: tyre.equipmentId,
          position: tyre.position,
          installedDate: tyre.installationDate || new Date(),
          removedDate: new Date(),
          hoursUsed: tyre.operatingHours,
          reason: reason || 'Routine dismount to inventory'
        });
      }

      tyre.equipmentId = null;
      tyre.position = 'Unassigned';
      tyre.status = 'Spare / Inventory';
      await tyre.save();

      return res.json({ success: true, message: 'Tyre unmounted successfully to inventory', data: tyre });
    }

    // Verify equipment exists and belongs to the same company
    const equipment = await Equipment.findOne({ _id: equipmentId, ...tenantFilter });
    if (!equipment) {
      return res.status(404).json({ success: false, message: 'Assigned equipment not found or access denied' });
    }

    // Check if another tyre is currently mounted at that position
    const existingTyreOnPos = await Tyre.findOne({
      ...tenantFilter,
      equipmentId: equipment._id,
      position,
      _id: { $ne: tyre._id }
    });

    if (existingTyreOnPos) {
      // Automatically dismount the incumbent tyre to inventory
      existingTyreOnPos.replacementHistory.push({
        equipmentId: equipment._id,
        position: existingTyreOnPos.position,
        installedDate: existingTyreOnPos.installationDate || new Date(),
        removedDate: new Date(),
        hoursUsed: existingTyreOnPos.operatingHours,
        reason: `Replaced by tyre ${tyre.tyreId}`
      });

      existingTyreOnPos.equipmentId = null;
      existingTyreOnPos.position = 'Unassigned';
      existingTyreOnPos.status = 'Spare / Inventory';
      await existingTyreOnPos.save();
    }

    // Mount target tyre
    tyre.equipmentId = equipment._id;
    tyre.position = position;
    tyre.status = 'In Service';
    tyre.installationDate = new Date();
    tyre.siteId = equipment.siteId;

    await tyre.save();

    await runAlertScan().catch(() => {});

    res.json({
      success: true,
      message: `Tyre ${tyre.tyreId} mounted to ${equipment.equipmentId} at position ${position}`,
      data: tyre
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Scrap tyre / Decommission
// @route   POST /api/tyres/:id/scrap
// @access  Private (Manager, Owner, Super Admin)
const scrapTyre = async (req, res, next) => {
  try {
    const tenantFilter = getTenantScope(req);
    const { reason } = req.body;
    const tyre = await Tyre.findOne({ _id: req.params.id, ...tenantFilter });

    if (!tyre) {
      return res.status(404).json({ success: false, message: 'Tyre not found or access denied' });
    }

    if (tyre.equipmentId) {
      tyre.replacementHistory.push({
        equipmentId: tyre.equipmentId,
        position: tyre.position,
        installedDate: tyre.installationDate || new Date(),
        removedDate: new Date(),
        hoursUsed: tyre.operatingHours,
        reason: reason || 'Scrapped due to wear/damage'
      });
      tyre.equipmentId = null;
      tyre.position = 'Unassigned';
    }

    tyre.status = 'Scrapped';
    tyre.removalDate = new Date();
    tyre.notes = tyre.notes ? `${tyre.notes} | Scrapped: ${reason}` : `Scrapped: ${reason}`;

    await tyre.save();

    res.json({ success: true, message: 'Tyre marked as scrapped', data: tyre });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete tyre
// @route   DELETE /api/tyres/:id
// @access  Private (Owner, Super Admin)
const deleteTyre = async (req, res, next) => {
  try {
    const tenantFilter = getTenantScope(req);
    const tyre = await Tyre.findOne({ _id: req.params.id, ...tenantFilter });

    if (!tyre) {
      return res.status(404).json({ success: false, message: 'Tyre not found or access denied' });
    }

    await Tyre.findByIdAndDelete(tyre._id);

    res.json({ success: true, message: 'Tyre deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTyres,
  getTyreById,
  createTyre,
  updateTyre,
  mountTyre,
  scrapTyre,
  deleteTyre
};

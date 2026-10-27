const Maintenance = require('../models/Maintenance');
const Equipment = require('../models/Equipment');
const { getTenantScope, resolveTenantCompanyId } = require('../middleware/authMiddleware');
const { runAlertScan } = require('../services/alertEngine');

// @desc    Get all maintenance work orders (Tenant Scoped)
// @route   GET /api/maintenance
// @access  Private
const getMaintenance = async (req, res, next) => {
  try {
    const { status, priority, maintenanceType, equipmentId, technicianId, search } = req.query;
    const tenantFilter = getTenantScope(req);
    const query = { ...tenantFilter };

    if (status && status !== 'All') query.status = status;
    if (priority && priority !== 'All') query.priority = priority;
    if (maintenanceType && maintenanceType !== 'All') query.maintenanceType = maintenanceType;
    if (equipmentId && equipmentId !== 'All') query.equipmentId = equipmentId;
    if (technicianId && technicianId !== 'All') query.assignedTechnicianId = technicianId;

    if (search) {
      query.$and = query.$and || [];
      query.$and.push({
        $or: [
          { maintenanceId: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ]
      });
    }

    const orders = await Maintenance.find(query)
      .populate('equipmentId', 'equipmentId name type status healthStatus siteId')
      .populate('assignedTechnicianId', 'name email phone role')
      .populate('companyId', 'name code')
      .populate('createdBy', 'name email role')
      .sort({ scheduledDate: 1 });

    res.json({ success: true, count: orders.length, data: orders });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single maintenance order by ID
// @route   GET /api/maintenance/:id
// @access  Private
const getMaintenanceById = async (req, res, next) => {
  try {
    const tenantFilter = getTenantScope(req);
    const order = await Maintenance.findOne({ _id: req.params.id, ...tenantFilter })
      .populate('equipmentId')
      .populate('assignedTechnicianId', 'name email phone')
      .populate('companyId');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Maintenance order not found or access denied' });
    }

    res.json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new maintenance order
// @route   POST /api/maintenance
// @access  Private (Owner, Manager, Super Admin)
const createMaintenance = async (req, res, next) => {
  try {
    const companyId = resolveTenantCompanyId(req);
    if (!companyId) {
      return res.status(400).json({ success: false, message: 'Company assignment is required' });
    }

    const {
      equipmentId,
      tyreId,
      maintenanceType,
      description,
      priority,
      scheduledDate,
      assignedTechnicianId,
      cost,
      notes,
      partsReplaced
    } = req.body;

    const maintenanceId = `WO-${Date.now().toString().slice(-6)}`;

    const order = await Maintenance.create({
      companyId,
      maintenanceId,
      equipmentId,
      tyreId: tyreId || null,
      maintenanceType,
      description,
      priority: priority || 'Medium',
      scheduledDate,
      assignedTechnicianId: assignedTechnicianId || null,
      status: assignedTechnicianId ? 'Assigned' : 'Scheduled',
      cost: Number(cost || 0),
      notes: notes || '',
      partsReplaced: partsReplaced || [],
      createdBy: req.user?._id || null,
      createdByName: req.user?.name || (req.user?.role === 'MAINTENANCE_MANAGER' ? 'Company Manager' : 'Company Operator'),
      createdByRole: req.user?.role || 'MAINTENANCE_MANAGER'
    });

    // If High/Critical or Corrective, update equipment status to Under Maintenance
    if (priority === 'Critical' || maintenanceType === 'Emergency') {
      await Equipment.findOneAndUpdate({ _id: equipmentId, companyId }, { status: 'Under Maintenance' });
    }

    await runAlertScan().catch(() => {});

    const populated = await Maintenance.findById(order._id)
      .populate('equipmentId')
      .populate('assignedTechnicianId')
      .populate('companyId')
      .populate('createdBy', 'name email role');

    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    next(error);
  }
};

// @desc    Update maintenance order (Status, Progress, Costs, Parts)
// @route   PUT /api/maintenance/:id
// @access  Private
const updateMaintenance = async (req, res, next) => {
  try {
    const tenantFilter = getTenantScope(req);
    const order = await Maintenance.findOne({ _id: req.params.id, ...tenantFilter });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Maintenance order not found or access denied' });
    }

    delete req.body.companyId;

    const { status, completionDate, startDate, cost, notes, partsReplaced } = req.body;

    if (status) order.status = status;
    if (cost !== undefined) order.cost = Number(cost);
    if (notes !== undefined) order.notes = notes;
    if (partsReplaced) order.partsReplaced = partsReplaced;

    if (status === 'In Progress' && !order.startDate) {
      order.startDate = startDate || new Date();
      await Equipment.findOneAndUpdate({ _id: order.equipmentId, companyId: order.companyId }, { status: 'Under Maintenance' });
    }

    if (status === 'Completed') {
      order.completionDate = completionDate || new Date();
      // Restore equipment status to Active and healthy
      await Equipment.findOneAndUpdate(
        { _id: order.equipmentId, companyId: order.companyId },
        { status: 'Active', healthStatus: 'Good', lastInspectionDate: new Date() }
      );
    }

    await order.save();
    await runAlertScan().catch(() => {});

    const populated = await Maintenance.findById(order._id)
      .populate('equipmentId')
      .populate('assignedTechnicianId')
      .populate('companyId');

    res.json({ success: true, data: populated });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete maintenance order
// @route   DELETE /api/maintenance/:id
// @access  Private (Owner, Manager, Super Admin)
const deleteMaintenance = async (req, res, next) => {
  try {
    const tenantFilter = getTenantScope(req);
    const order = await Maintenance.findOne({ _id: req.params.id, ...tenantFilter });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Maintenance order not found or access denied' });
    }

    await Maintenance.findByIdAndDelete(order._id);

    res.json({ success: true, message: 'Work order removed successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Approve or Reject maintenance order
// @route   PUT /api/maintenance/:id/approve
// @access  Private (Owner, Super Admin)
const approveMaintenance = async (req, res, next) => {
  try {
    const tenantFilter = getTenantScope(req);
    const order = await Maintenance.findOne({ _id: req.params.id, ...tenantFilter });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Maintenance order not found or access denied' });
    }

    const { approvalStatus, notes } = req.body;
    order.approvalStatus = approvalStatus === 'Rejected' ? 'Rejected' : 'Approved';
    order.approvedBy = req.user._id;
    order.approvedAt = new Date();
    if (notes) order.notes = (order.notes ? order.notes + ' | ' : '') + `Approval Note: ${notes}`;

    await order.save();

    const populated = await Maintenance.findById(order._id)
      .populate('equipmentId')
      .populate('assignedTechnicianId')
      .populate('approvedBy', 'name email role')
      .populate('companyId');

    res.json({ success: true, data: populated });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark assigned maintenance task as completed
// @route   PUT /api/maintenance/:id/complete
// @access  Private (Technician, Manager, Owner, Super Admin)
const completeMaintenance = async (req, res, next) => {
  try {
    const tenantFilter = getTenantScope(req);
    const order = await Maintenance.findOne({ _id: req.params.id, ...tenantFilter });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Maintenance task not found or access denied' });
    }

    // If Technician, verify assignment
    if (req.user.role === 'TECHNICIAN' && order.assignedTechnicianId && String(order.assignedTechnicianId) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'You can only complete tasks assigned to you' });
    }

    const { completionNotes, downtimeHours, partsReplaced } = req.body;
    order.status = 'Completed';
    order.completionDate = new Date();
    if (completionNotes) order.completionNotes = completionNotes;
    if (downtimeHours) order.downtimeHours = Number(downtimeHours);
    if (partsReplaced) order.partsReplaced = partsReplaced;

    // Restore equipment status to Active and healthy
    await Equipment.findOneAndUpdate(
      { _id: order.equipmentId, companyId: order.companyId },
      { status: 'Active', healthStatus: 'Good', lastInspectionDate: new Date() }
    );

    await order.save();
    await runAlertScan().catch(() => {});

    const populated = await Maintenance.findById(order._id)
      .populate('equipmentId')
      .populate('assignedTechnicianId')
      .populate('companyId');

    res.json({ success: true, message: 'Task marked as completed', data: populated });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMaintenance,
  getMaintenanceById,
  createMaintenance,
  updateMaintenance,
  deleteMaintenance,
  approveMaintenance,
  completeMaintenance
};

const Inspection = require('../models/Inspection');
const Equipment = require('../models/Equipment');
const Tyre = require('../models/Tyre');
const { getTenantScope, resolveTenantCompanyId } = require('../middleware/authMiddleware');
const { runAlertScan } = require('../services/alertEngine');

// @desc    Get all inspections with filters (Tenant Scoped)
// @route   GET /api/inspections
// @access  Private
const getInspections = async (req, res, next) => {
  try {
    const { inspectionType, equipmentId, tyreId, search } = req.query;
    const tenantFilter = getTenantScope(req);
    const query = { ...tenantFilter };

    // Field Technicians view their own checks and inspections
    if (req.user && req.user.role === 'TECHNICIAN') {
      query.technicianId = req.user._id;
    }

    if (inspectionType && inspectionType !== 'All') {
      query.inspectionType = inspectionType;
    }
    if (equipmentId && equipmentId !== 'All') {
      query.equipmentId = equipmentId;
    }
    if (tyreId && tyreId !== 'All') {
      query.tyreId = tyreId;
    }

    if (search) {
      query.$or = [
        { inspectionNumber: { $regex: search, $options: 'i' } },
        { notes: { $regex: search, $options: 'i' } },
        { actionRecommended: { $regex: search, $options: 'i' } }
      ];
    }

    const inspections = await Inspection.find(query)
      .populate('equipmentId', 'equipmentId name type status healthStatus')
      .populate('tyreId', 'tyreId brand model position')
      .populate('technicianId', 'name email role')
      .populate('companyId', 'name code')
      .sort({ inspectionDate: -1 });

    res.json({ success: true, count: inspections.length, data: inspections });
  } catch (error) {
    next(error);
  }
};

// @desc    Log a new inspection (Equipment or Tyre)
// @route   POST /api/inspections
// @access  Private (Technician, Manager, Owner, Super Admin)
const createInspection = async (req, res, next) => {
  try {
    const companyId = resolveTenantCompanyId(req);
    if (!companyId) {
      return res.status(400).json({ success: false, message: 'Company assignment is required' });
    }

    const {
      inspectionType,
      equipmentId,
      tyreId,
      inspectionDate,
      engineCondition,
      brakeCondition,
      hydraulicSystem,
      electricalSystem,
      oilLevel,
      coolingSystem,
      equipmentOverallCondition,
      treadDepth,
      pressure,
      temperature,
      visibleDamage,
      wearCondition,
      tyreOverallCondition,
      notes,
      actionRecommended
    } = req.body;

    const inspectionNumber = `INSP-${Date.now().toString().slice(-6)}`;
    const technicianId = req.user._id;

    const inspection = await Inspection.create({
      companyId,
      inspectionNumber,
      inspectionType,
      equipmentId: equipmentId || null,
      tyreId: tyreId || null,
      technicianId,
      inspectionDate: inspectionDate || new Date(),
      engineCondition,
      brakeCondition,
      hydraulicSystem,
      electricalSystem,
      oilLevel,
      coolingSystem,
      equipmentOverallCondition,
      treadDepth,
      pressure,
      temperature,
      visibleDamage,
      wearCondition,
      tyreOverallCondition,
      notes,
      actionRecommended
    });

    // Update corresponding Equipment if inspected
    if (inspectionType === 'Equipment' && equipmentId) {
      const updateData = { lastInspectionDate: new Date() };
      if (equipmentOverallCondition === 'Critical') {
        updateData.healthStatus = 'Critical';
      } else if (equipmentOverallCondition === 'Warning') {
        updateData.healthStatus = 'Warning';
      } else if (equipmentOverallCondition === 'Good') {
        updateData.healthStatus = 'Good';
      }
      await Equipment.findOneAndUpdate({ _id: equipmentId, companyId }, updateData);
    }

    // Update corresponding Tyre if inspected
    if (inspectionType === 'Tyre' && tyreId) {
      const tyreUpdate = {};
      if (treadDepth !== undefined && treadDepth !== null) tyreUpdate.currentTreadDepth = Number(treadDepth);
      if (pressure !== undefined && pressure !== null) tyreUpdate.currentPressure = Number(pressure);
      if (temperature !== undefined && temperature !== null) tyreUpdate.currentTemperature = Number(temperature);
      if (tyreOverallCondition) tyreUpdate.condition = tyreOverallCondition;

      const tyre = await Tyre.findOne({ _id: tyreId, companyId });
      if (tyre) {
        Object.assign(tyre, tyreUpdate);
        await tyre.save();
      }
    }

    await runAlertScan().catch(() => {});

    const populated = await Inspection.findById(inspection._id)
      .populate('equipmentId')
      .populate('tyreId')
      .populate('technicianId', 'name email role')
      .populate('companyId');

    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    next(error);
  }
};

// @desc    Get inspection details by ID
// @route   GET /api/inspections/:id
// @access  Private
const getInspectionById = async (req, res, next) => {
  try {
    const tenantFilter = getTenantScope(req);
    const inspection = await Inspection.findOne({ _id: req.params.id, ...tenantFilter })
      .populate('equipmentId')
      .populate('tyreId')
      .populate('technicianId', 'name email role phone')
      .populate('companyId');

    if (!inspection) {
      return res.status(404).json({ success: false, message: 'Inspection not found or access denied' });
    }

    res.json({ success: true, data: inspection });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getInspections,
  createInspection,
  getInspectionById
};

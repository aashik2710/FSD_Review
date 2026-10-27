const Alert = require('../models/Alert');
const Equipment = require('../models/Equipment');
const Tyre = require('../models/Tyre');
const Maintenance = require('../models/Maintenance');
const { getTenantScope } = require('../middleware/authMiddleware');
const { runAlertScan } = require('../services/alertEngine');

// @desc    Get all active/resolved alerts (Tenant Scoped)
// @route   GET /api/alerts
// @access  Private
const getAlerts = async (req, res, next) => {
  try {
    const { severity, category, isResolved } = req.query;
    const tenantFilter = getTenantScope(req);
    const query = { ...tenantFilter };

    if (severity && severity !== 'All') query.severity = severity;
    if (category && category !== 'All') query.category = category;
    
    if (isResolved !== undefined) {
      query.isResolved = isResolved === 'true';
    }

    const alerts = await Alert.find(query)
      .populate('equipmentId', 'equipmentId name type status healthStatus')
      .populate('tyreId', 'tyreId brand model position')
      .populate('resolvedBy', 'name email')
      .populate('companyId', 'name code')
      .sort({ createdAt: -1 });

    const unresolvedCount = await Alert.countDocuments({ ...tenantFilter, isResolved: false });
    const criticalCount = await Alert.countDocuments({ ...tenantFilter, isResolved: false, severity: 'Critical' });

    res.json({
      success: true,
      count: alerts.length,
      unresolvedCount,
      criticalCount,
      data: alerts
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Resolve alert / Mark problem as fixed
// @route   PUT /api/alerts/:id/resolve
// @access  Private
const resolveAlert = async (req, res, next) => {
  try {
    const tenantFilter = getTenantScope(req);
    let alert = await Alert.findOne({ _id: req.params.id, ...tenantFilter });
    if (!alert) {
      alert = await Alert.findById(req.params.id);
    }
    if (!alert) {
      return res.status(404).json({ success: false, message: 'Alert not found or access denied' });
    }

    alert.isResolved = true;
    alert.resolvedBy = req.user ? req.user._id : null;
    alert.resolvedAt = new Date();
    await alert.save();

    // When problem is marked as fixed, restore underlying machinery/tyre health
    // to prevent alert engine from immediately re-flagging the alert
    if (alert.equipmentId) {
      await Equipment.findByIdAndUpdate(alert.equipmentId, {
        $set: {
          status: 'Active',
          healthStatus: 'Good',
          healthScore: 95,
          lastActiveTime: new Date()
        }
      });
    }

    if (alert.tyreId) {
      const tyre = await Tyre.findById(alert.tyreId);
      if (tyre) {
        tyre.condition = 'Good';
        if (tyre.currentTemperature > 85) tyre.currentTemperature = 65;
        if (tyre.standardPressure) tyre.currentPressure = tyre.standardPressure;
        if (tyre.currentTreadDepth <= 12) tyre.currentTreadDepth = tyre.initialTreadDepth || 90;
        await tyre.save();
      }
    }

    if (alert.maintenanceId) {
      await Maintenance.findByIdAndUpdate(alert.maintenanceId, {
        $set: { status: 'Completed' }
      });
    }

    res.json({ success: true, message: 'Problem marked as fixed', data: alert });
  } catch (error) {
    next(error);
  }
};

// @desc    Trigger instant alert scan
// @route   POST /api/alerts/scan
// @access  Private
const triggerAlertScan = async (req, res, next) => {
  try {
    await runAlertScan();
    const tenantFilter = getTenantScope(req);
    const activeAlerts = await Alert.find({ ...tenantFilter, isResolved: false })
      .populate('equipmentId')
      .populate('tyreId')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      message: 'Fleet condition audit completed successfully',
      count: activeAlerts.length,
      data: activeAlerts
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Report new equipment/tyre problem (Technician, Manager, Owner)
// @route   POST /api/alerts
// @access  Private
const createAlert = async (req, res, next) => {
  try {
    const { resolveTenantCompanyId } = require('../middleware/authMiddleware');
    const companyId = resolveTenantCompanyId(req);
    const { title, message, severity, category, equipmentId, tyreId, photoUrl } = req.body;

    if (!title || !message) {
      return res.status(400).json({ success: false, message: 'Title and description are required to report a problem' });
    }

    const alert = await Alert.create({
      companyId,
      title,
      message,
      severity: severity || 'High',
      category: category || (equipmentId ? 'Equipment Health' : 'Tyre Pressure'),
      equipmentId: equipmentId || null,
      tyreId: tyreId || null,
      photoUrl: photoUrl || null,
      reportedBy: req.user._id,
      isResolved: false
    });

    // If High/Critical, mark equipment/tyre condition
    if (equipmentId && (severity === 'High' || severity === 'Critical')) {
      await Equipment.findOneAndUpdate({ _id: equipmentId, companyId }, { healthStatus: 'Warning' });
    }
    if (tyreId && (severity === 'High' || severity === 'Critical')) {
      await Tyre.findOneAndUpdate({ _id: tyreId, companyId }, { condition: 'Warning' });
    }

    const populated = await Alert.findById(alert._id)
      .populate('equipmentId', 'equipmentId name type status')
      .populate('tyreId', 'tyreId brand model position')
      .populate('reportedBy', 'name email role');

    res.status(201).json({ success: true, message: 'Problem reported successfully', data: populated });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAlerts,
  createAlert,
  resolveAlert,
  triggerAlertScan
};

const Inspection = require('../models/Inspection');
const Maintenance = require('../models/Maintenance');
const Alert = require('../models/Alert');
const { getTenantScope } = require('../middleware/authMiddleware');

// @desc    Get complete chronological history of checks, maintenance, and problem fixes
// @route   GET /api/history
// @access  Private
const getHistory = async (req, res, next) => {
  try {
    const tenantFilter = getTenantScope(req);
    const { filterType } = req.query; // 'All', 'Equipment Checks', 'Tyre Checks', 'Maintenance', 'Problems'

    const isTechnician = req.user && req.user.role === 'TECHNICIAN';
    const inspQuery = isTechnician ? { ...tenantFilter, technicianId: req.user._id } : { ...tenantFilter };

    const [inspections, maintenances, alerts] = await Promise.all([
      Inspection.find(inspQuery)
        .populate('equipmentId', 'equipmentId name')
        .populate('tyreId', 'tyreId brand model position')
        .populate('technicianId', 'name')
        .sort({ createdAt: -1 })
        .limit(100),
      isTechnician
        ? Promise.resolve([])
        : Maintenance.find(tenantFilter)
            .populate('equipmentId', 'equipmentId name')
            .populate('assignedTechnicianId', 'name')
            .sort({ createdAt: -1 })
            .limit(100),
      Alert.find(tenantFilter)
        .populate('equipmentId', 'equipmentId name')
        .populate('tyreId', 'tyreId position')
        .sort({ createdAt: -1 })
        .limit(100)
    ]);

    const timeline = [];

    // Map inspections
    inspections.forEach((item) => {
      const isEq = item.inspectionType === 'Equipment';
      const cond = isEq ? item.equipmentOverallCondition : item.tyreOverallCondition;
      let simpleStatus = 'Good';
      if (cond === 'Critical') simpleStatus = 'Problem';
      else if (cond === 'Warning') simpleStatus = 'Needs Checking';

      timeline.push({
        id: item._id,
        category: isEq ? 'Equipment Check' : 'Tyre Check',
        title: isEq
          ? `Equipment Check: ${item.equipmentId?.name || item.equipmentId?.equipmentId || 'Machine'}`
          : `Tyre Check: ${item.tyreId?.tyreId || 'Tyre'} (${item.tyreId?.position || 'N/A'})`,
        status: simpleStatus,
        details: item.notes || (isEq ? `Engine: ${item.engineCondition}, Brakes: ${item.brakeCondition}` : `Tread: ${item.treadDepth || 0}mm, Pressure: ${item.pressure || 0} PSI`),
        performedBy: item.technicianId?.name || 'Technician',
        date: item.inspectionDate || item.createdAt,
        rawType: 'inspection',
        targetId: isEq ? item.equipmentId?._id : item.tyreId?._id
      });
    });

    // Map maintenance
    maintenances.forEach((item) => {
      let simpleStatus = 'Needs Checking';
      if (item.status === 'Completed') simpleStatus = 'Good';
      else if (item.status === 'In Progress' || item.status === 'Scheduled') simpleStatus = 'Needs Checking';

      timeline.push({
        id: item._id,
        category: 'Maintenance',
        title: `Maintenance (${item.maintenanceType || 'Routine'}): ${item.equipmentId?.name || 'Equipment'}`,
        status: simpleStatus,
        details: `${item.title} - ₹${(item.cost || 0).toLocaleString('en-IN')}. Status: ${item.status}`,
        performedBy: item.assignedTechnicianId?.name || 'Service Team',
        date: item.completedDate || item.scheduledDate || item.createdAt,
        rawType: 'maintenance',
        targetId: item.equipmentId?._id
      });
    });

    // Map problems
    alerts.forEach((item) => {
      timeline.push({
        id: item._id,
        category: 'Problem Report',
        title: `Problem: ${item.title}`,
        status: item.isResolved ? 'Good' : 'Problem',
        details: `${item.message} ${item.isResolved ? `(Resolved on ${new Date(item.resolvedAt).toLocaleDateString()})` : '(Active Problem)'}`,
        performedBy: item.isResolved ? 'Resolved by Operator' : 'System Flag',
        date: item.resolvedAt || item.createdAt,
        rawType: 'alert',
        targetId: item.equipmentId?._id || item.tyreId?._id
      });
    });

    // Sort descending by date
    timeline.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Filter if needed
    let filteredTimeline = timeline;
    if (filterType && filterType !== 'All') {
      filteredTimeline = timeline.filter((t) => t.category.toLowerCase().includes(filterType.toLowerCase()));
    }

    res.json({
      success: true,
      count: filteredTimeline.length,
      data: filteredTimeline
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getHistory
};

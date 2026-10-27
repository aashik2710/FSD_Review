const Equipment = require('../models/Equipment');
const Tyre = require('../models/Tyre');
const Maintenance = require('../models/Maintenance');
const Alert = require('../models/Alert');
const Site = require('../models/Site');
const { getTenantScope } = require('../middleware/authMiddleware');
const { runAlertScan } = require('../services/alertEngine');

// @desc    Get top-level dashboard KPI statistics (Tenant Scoped)
// @route   GET /api/dashboard/stats
// @access  Private
const getDashboardStats = async (req, res, next) => {
  try {
    await runAlertScan().catch(() => {});
    const tenantFilter = getTenantScope(req);

    const [
      totalEquipment,
      activeEquipment,
      underMaintenanceEquipment,
      breakdownEquipment,
      totalTyres,
      goodTyres,
      warningTyres,
      criticalTyres,
      scheduledMaintenance,
      inProgressMaintenance,
      overdueMaintenance,
      unresolvedAlerts,
      criticalAlerts,
      totalSites
    ] = await Promise.all([
      Equipment.countDocuments(tenantFilter),
      Equipment.countDocuments({ ...tenantFilter, status: 'Active' }),
      Equipment.countDocuments({ ...tenantFilter, status: 'Under Maintenance' }),
      Equipment.countDocuments({ ...tenantFilter, status: 'Breakdown' }),
      Tyre.countDocuments(tenantFilter),
      Tyre.countDocuments({ ...tenantFilter, condition: 'Good' }),
      Tyre.countDocuments({ ...tenantFilter, condition: 'Warning' }),
      Tyre.countDocuments({ ...tenantFilter, condition: 'Critical' }),
      Maintenance.countDocuments({ ...tenantFilter, status: 'Scheduled' }),
      Maintenance.countDocuments({ ...tenantFilter, status: 'In Progress' }),
      Maintenance.countDocuments({
        ...tenantFilter,
        scheduledDate: { $lt: new Date() },
        status: { $in: ['Scheduled', 'Assigned', 'In Progress'] }
      }),
      Alert.countDocuments({ ...tenantFilter, isResolved: false }),
      Alert.countDocuments({ ...tenantFilter, isResolved: false, severity: 'Critical' }),
      Site.countDocuments(tenantFilter)
    ]);

    // Calculate Fleet Health Index (0 - 100%)
    const equipmentHealthGood = await Equipment.countDocuments({ ...tenantFilter, healthStatus: 'Good' });
    const fleetHealthIndex = totalEquipment > 0 ? Math.round((equipmentHealthGood / totalEquipment) * 100) : 100;

    res.json({
      success: true,
      data: {
        equipment: {
          total: totalEquipment,
          active: activeEquipment,
          underMaintenance: underMaintenanceEquipment,
          breakdown: breakdownEquipment,
          healthIndex: fleetHealthIndex
        },
        tyres: {
          total: totalTyres,
          good: goodTyres,
          warning: warningTyres,
          critical: criticalTyres
        },
        maintenance: {
          scheduled: scheduledMaintenance,
          inProgress: inProgressMaintenance,
          overdue: overdueMaintenance
        },
        alerts: {
          unresolved: unresolvedAlerts,
          critical: criticalAlerts
        },
        sites: {
          total: totalSites
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get chart data for fleet status & monthly maintenance costs
// @route   GET /api/dashboard/charts
// @access  Private
const getDashboardCharts = async (req, res, next) => {
  try {
    const tenantFilter = getTenantScope(req);

    // Fleet Status Distribution
    const [activeEq, maintEq, breakdownEq, goodTyres, warnTyres, critTyres] = await Promise.all([
      Equipment.countDocuments({ ...tenantFilter, status: 'Active' }),
      Equipment.countDocuments({ ...tenantFilter, status: 'Under Maintenance' }),
      Equipment.countDocuments({ ...tenantFilter, status: 'Breakdown' }),
      Tyre.countDocuments({ ...tenantFilter, condition: 'Good' }),
      Tyre.countDocuments({ ...tenantFilter, condition: 'Warning' }),
      Tyre.countDocuments({ ...tenantFilter, condition: 'Critical' })
    ]);

    const fleetStatusChart = [
      { name: 'Active', value: activeEq, color: '#10B981' },
      { name: 'Under Maintenance', value: maintEq, color: '#F59E0B' },
      { name: 'Breakdown', value: breakdownEq, color: '#EF4444' }
    ];

    const tyreConditionChart = [
      { name: 'Good (Healthy)', count: goodTyres, fill: '#10B981' },
      { name: 'Warning (Watch)', count: warnTyres, fill: '#F59E0B' },
      { name: 'Critical (Action)', count: critTyres, fill: '#EF4444' }
    ];

    // Aggregated Maintenance Cost (Past 6 Months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const completedOrders = await Maintenance.find({
      ...tenantFilter,
      createdAt: { $gte: sixMonthsAgo }
    }).select('cost createdAt maintenanceType');

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyCostMap = {};

    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const label = `${monthNames[d.getMonth()]}`;
      monthlyCostMap[label] = { month: label, cost: 0, preventative: 0, corrective: 0 };
    }

    completedOrders.forEach((order) => {
      const date = new Date(order.createdAt);
      const label = `${monthNames[date.getMonth()]}`;
      if (monthlyCostMap[label]) {
        monthlyCostMap[label].cost += order.cost || 0;
        if (order.maintenanceType === 'Preventive') {
          monthlyCostMap[label].preventative += order.cost || 0;
        } else {
          monthlyCostMap[label].corrective += order.cost || 0;
        }
      }
    });

    const costTrendChart = Object.values(monthlyCostMap);

    res.json({
      success: true,
      data: {
        fleetStatus: fleetStatusChart,
        tyreCondition: tyreConditionChart,
        costTrend: costTrendChart
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get live operational feed & recent anomaly alerts
// @route   GET /api/dashboard/live-feed
// @access  Private
const getLiveOperationalFeed = async (req, res, next) => {
  try {
    const tenantFilter = getTenantScope(req);

    const [recentAlerts, recentMaintenances, highHoursEquipment] = await Promise.all([
      Alert.find({ ...tenantFilter, isResolved: false })
        .populate('equipmentId', 'equipmentId name')
        .populate('tyreId', 'tyreId position')
        .sort({ createdAt: -1 })
        .limit(5),
      Maintenance.find(tenantFilter)
        .populate('equipmentId', 'equipmentId name')
        .populate('assignedTechnicianId', 'name')
        .sort({ updatedAt: -1 })
        .limit(5),
      Equipment.find({ ...tenantFilter, status: { $in: ['Active', 'Under Maintenance'] } })
        .populate('siteId', 'name')
        .sort({ operatingHours: -1 })
        .limit(4)
    ]);

    res.json({
      success: true,
      data: {
        recentAlerts,
        recentMaintenances,
        highHoursEquipment
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardStats,
  getDashboardCharts,
  getLiveOperationalFeed
};

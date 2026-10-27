const Alert = require('../models/Alert');
const Equipment = require('../models/Equipment');
const Tyre = require('../models/Tyre');
const Maintenance = require('../models/Maintenance');

/**
 * Scan fleet conditions and create automatic alerts with company tenant isolation
 */
const runAlertScan = async () => {
  try {
    const now = new Date();

    // 1. Check for Overdue Maintenance
    const overdueMaintenances = await Maintenance.find({
      scheduledDate: { $lt: now },
      status: { $in: ['Scheduled', 'Assigned', 'In Progress'] }
    }).populate('equipmentId');

    for (const m of overdueMaintenances) {
      if (!m.companyId) continue;
      const eqIdStr = m.equipmentId ? m.equipmentId.equipmentId : 'Equipment';
      const existingAlert = await Alert.findOne({
        companyId: m.companyId,
        maintenanceId: m._id,
        category: 'Maintenance Overdue',
        isResolved: false
      });

      if (!existingAlert) {
        await Alert.create({
          companyId: m.companyId,
          title: `Overdue Maintenance: ${m.maintenanceId}`,
          message: `Maintenance task '${m.description}' for ${eqIdStr} is past scheduled date (${new Date(m.scheduledDate).toLocaleDateString()}).`,
          severity: m.priority === 'Critical' ? 'Critical' : 'High',
          category: 'Maintenance Overdue',
          equipmentId: m.equipmentId?._id || null,
          maintenanceId: m._id
        });
      }
    }

    // 2. Check for Breakdown and Critical Equipment
    const criticalEquipments = await Equipment.find({
      $or: [{ status: 'Breakdown' }, { healthStatus: 'Critical' }]
    });

    for (const eq of criticalEquipments) {
      if (!eq.companyId) continue;
      const category = eq.status === 'Breakdown' ? 'Breakdown' : 'Equipment Health';
      const existingAlert = await Alert.findOne({
        companyId: eq.companyId,
        equipmentId: eq._id,
        category,
        isResolved: false
      });

      if (!existingAlert) {
        await Alert.create({
          companyId: eq.companyId,
          title: `${category.toUpperCase()}: ${eq.equipmentId}`,
          message: `${eq.name} (${eq.type}) is currently marked as ${eq.status} with health status ${eq.healthStatus}. Immediate technical intervention required.`,
          severity: 'Critical',
          category,
          equipmentId: eq._id
        });
      }
    }

    // 3. Check for Dangerous Tyre Pressures and Critical Tread Wear
    const anomalousTyres = await Tyre.find({
      $or: [
        { condition: 'Critical' },
        { currentTreadDepth: { $lte: 12 } },
        { currentTemperature: { $gt: 95 } }
      ]
    }).populate('equipmentId');

    for (const t of anomalousTyres) {
      if (!t.companyId) continue;
      let category = 'Tyre Pressure';
      let title = `CRITICAL PRESSURE: ${t.tyreId}`;
      let message = `Tyre ${t.tyreId} pressure is deviated at ${t.currentPressure} PSI (Target: ${t.standardPressure} PSI).`;

      if (t.currentTreadDepth <= 12) {
        category = 'Tyre Tread';
        title = `CRITICAL TREAD WEAR: ${t.tyreId}`;
        message = `Tread depth is down to ${t.currentTreadDepth}mm (Initial: ${t.initialTreadDepth}mm). Retread or replacement needed immediately.`;
      } else if (t.currentTemperature > 95) {
        category = 'Tyre Temperature';
        title = `THERMAL OVERHEAT WARNING: ${t.tyreId}`;
        message = `Tyre core temperature is recorded at ${t.currentTemperature}°C, exceeding safe threshold of 85°C.`;
      }

      const existingAlert = await Alert.findOne({
        companyId: t.companyId,
        tyreId: t._id,
        category,
        isResolved: false
      });

      if (!existingAlert) {
        await Alert.create({
          companyId: t.companyId,
          title,
          message,
          severity: 'Critical',
          category,
          tyreId: t._id,
          equipmentId: t.equipmentId?._id || null
        });
      }
    }
  } catch (error) {
    console.error('[runAlertScan Error]:', error.message);
  }
};

module.exports = { runAlertScan };

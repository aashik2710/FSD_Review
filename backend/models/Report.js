const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: [true, 'Company ID is required'],
      index: true
    },
    title: {
      type: String,
      required: [true, 'Report title is required'],
      trim: true
    },
    reportType: {
      type: String,
      enum: ['Fleet Health & Availability', 'OTR Tyre Lifecycle & CPK', 'MTBF & Maintenance Cost', 'Safety & Inspection Compliance'],
      required: true
    },
    period: {
      type: String,
      enum: ['Last 7 Days', 'Last 30 Days', 'Quarter-to-Date', 'Year-to-Date'],
      default: 'Last 30 Days'
    },
    generatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    summary: {
      totalEquipment: Number,
      fleetAvailabilityPercent: Number,
      activeTyresCount: Number,
      avgTreadWearPercent: Number,
      totalMaintenanceSpendUSD: Number,
      meanTimeToRepairHours: Number,
      meanTimeBetweenFailuresHours: Number,
      openCriticalAlerts: Number
    },
    dataSnapshot: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  {
    timestamps: true
  }
);

reportSchema.index({ companyId: 1, createdAt: -1 });

module.exports = mongoose.model('Report', reportSchema);

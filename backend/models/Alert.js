const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: [true, 'Company ID is required'],
      index: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    message: {
      type: String,
      required: true,
      trim: true
    },
    severity: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Critical'],
      default: 'Medium'
    },
    category: {
      type: String,
      enum: [
        'Equipment Health',
        'Tyre Pressure',
        'Tyre Temperature',
        'Tyre Tread',
        'Maintenance Overdue',
        'Breakdown',
        'Inspection Required',
        'System'
      ],
      required: true
    },
    equipmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Equipment',
      default: null,
      index: true
    },
    tyreId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tyre',
      default: null,
      index: true
    },
    maintenanceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Maintenance',
      default: null
    },
    isRead: {
      type: Boolean,
      default: false
    },
    isResolved: {
      type: Boolean,
      default: false
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    resolvedAt: {
      type: Date,
      default: null
    },
    photoUrl: {
      type: String,
      default: null
    },
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    }
  },
  {
    timestamps: true
  }
);

alertSchema.index({ companyId: 1, isResolved: 1, createdAt: -1 });

module.exports = mongoose.model('Alert', alertSchema);

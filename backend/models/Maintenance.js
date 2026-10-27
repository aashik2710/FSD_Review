const mongoose = require('mongoose');

const maintenanceSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: [true, 'Company ID is required'],
      index: true
    },
    maintenanceId: {
      type: String,
      required: true,
      trim: true
    },
    equipmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Equipment',
      required: [true, 'Equipment is required'],
      index: true
    },
    tyreId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tyre',
      default: null,
      index: true
    },
    maintenanceType: {
      type: String,
      enum: ['Preventive', 'Corrective', 'Emergency', 'Inspection', 'Tyre Replacement', 'Tyre Rotation'],
      required: [true, 'Maintenance type is required']
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Critical'],
      default: 'Medium'
    },
    scheduledDate: {
      type: Date,
      required: [true, 'Scheduled date is required']
    },
    assignedTechnicianId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    status: {
      type: String,
      enum: ['Scheduled', 'Assigned', 'In Progress', 'Completed', 'Cancelled', 'Overdue'],
      default: 'Scheduled'
    },
    approvalStatus: {
      type: String,
      enum: ['Pending Approval', 'Approved', 'Rejected'],
      default: 'Approved'
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    approvedAt: {
      type: Date,
      default: null
    },
    completionNotes: {
      type: String,
      default: ''
    },
    startDate: {
      type: Date,
      default: null
    },
    completionDate: {
      type: Date,
      default: null
    },
    downtimeHours: {
      type: Number,
      default: 0
    },
    cost: {
      type: Number,
      default: 0
    },
    notes: {
      type: String,
      default: ''
    },
    partsReplaced: [
      {
        partName: String,
        partNumber: String,
        quantity: Number,
        cost: Number
      }
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    createdByName: {
      type: String,
      default: ''
    },
    createdByRole: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

maintenanceSchema.index({ companyId: 1, maintenanceId: 1 }, { unique: true });

module.exports = mongoose.model('Maintenance', maintenanceSchema);

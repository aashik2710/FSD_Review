const mongoose = require('mongoose');

const inspectionSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: [true, 'Company ID is required'],
      index: true
    },
    inspectionNumber: {
      type: String,
      required: true
    },
    inspectionType: {
      type: String,
      enum: ['Equipment', 'Tyre'],
      required: [true, 'Inspection type is required']
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
    technicianId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Technician is required']
    },
    inspectionDate: {
      type: Date,
      default: Date.now
    },
    // Equipment Specific Inspection Fields
    engineCondition: {
      type: String,
      enum: ['Good', 'Fair', 'Poor', 'Critical', 'N/A'],
      default: 'N/A'
    },
    brakeCondition: {
      type: String,
      enum: ['Good', 'Fair', 'Poor', 'Critical', 'N/A'],
      default: 'N/A'
    },
    hydraulicSystem: {
      type: String,
      enum: ['Good', 'Fair', 'Poor', 'Critical', 'N/A'],
      default: 'N/A'
    },
    electricalSystem: {
      type: String,
      enum: ['Good', 'Fair', 'Poor', 'Critical', 'N/A'],
      default: 'N/A'
    },
    oilLevel: {
      type: String,
      enum: ['Normal', 'Low', 'Critical Low', 'Overfilled', 'N/A'],
      default: 'N/A'
    },
    coolingSystem: {
      type: String,
      enum: ['Normal', 'Overheating', 'Leaking', 'N/A'],
      default: 'N/A'
    },
    equipmentOverallCondition: {
      type: String,
      enum: ['Good', 'Warning', 'Critical', 'N/A'],
      default: 'N/A'
    },
    // Tyre Specific Inspection Fields
    treadDepth: {
      type: Number,
      default: null
    },
    pressure: {
      type: Number,
      default: null
    },
    temperature: {
      type: Number,
      default: null
    },
    visibleDamage: {
      type: String,
      enum: ['None', 'Sidewall Cuts', 'Bulges', 'Bead Separation', 'Severe Cracking', 'Impact Break', 'N/A'],
      default: 'N/A'
    },
    wearCondition: {
      type: String,
      enum: ['Even Wear', 'Shoulder Wear', 'Center Wear', 'Heel & Toe', 'One-sided Wear', 'N/A'],
      default: 'N/A'
    },
    tyreOverallCondition: {
      type: String,
      enum: ['Good', 'Warning', 'Critical', 'N/A'],
      default: 'N/A'
    },
    notes: {
      type: String,
      default: ''
    },
    actionRecommended: {
      type: String,
      default: 'Routine operation permitted'
    }
  },
  {
    timestamps: true
  }
);

inspectionSchema.index({ companyId: 1, inspectionNumber: 1 }, { unique: true });

module.exports = mongoose.model('Inspection', inspectionSchema);

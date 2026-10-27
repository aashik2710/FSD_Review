const mongoose = require('mongoose');

const equipmentSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: [true, 'Company ID is required'],
      index: true
    },
    equipmentId: {
      type: String,
      required: [true, 'Equipment ID (e.g. EQ-HT-101) is required'],
      trim: true,
      uppercase: true
    },
    name: {
      type: String,
      required: [true, 'Equipment name is required'],
      trim: true
    },
    type: {
      type: String,
      required: [true, 'Equipment type is required'],
      enum: ['Haul Truck', 'Excavator', 'Loader', 'Bulldozer', 'Drilling Machine', 'Grader', 'Water Truck', 'Other']
    },
    manufacturer: {
      type: String,
      required: [true, 'Manufacturer is required'],
      trim: true
    },
    model: {
      type: String,
      required: [true, 'Model is required'],
      trim: true
    },
    serialNumber: {
      type: String,
      trim: true,
      default: ''
    },
    siteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Site',
      required: [true, 'Site assignment is required'],
      index: true
    },
    yearOfManufacture: {
      type: Number,
      default: new Date().getFullYear()
    },
    operatingHours: {
      type: Number,
      default: 0,
      min: 0
    },
    status: {
      type: String,
      enum: ['Active', 'Under Maintenance', 'Breakdown', 'Inactive', 'Decommissioned'],
      default: 'Active'
    },
    assignedTechnicianId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    lastActiveTime: {
      type: Date,
      default: Date.now
    },
    healthStatus: {
      type: String,
      enum: ['Good', 'Warning', 'Critical'],
      default: 'Good'
    },
    healthScore: {
      type: Number,
      default: 95,
      min: 0,
      max: 100
    },
    lastInspectionDate: {
      type: Date,
      default: null
    },
    nextMaintenanceDate: {
      type: Date,
      default: null
    },
    fuelLevelPercentage: {
      type: Number,
      default: 85,
      min: 0,
      max: 100
    },
    engineTemperatureC: {
      type: Number,
      default: 88
    },
    oilPressureKPa: {
      type: Number,
      default: 420
    },
    notes: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

// Compound index to ensure uniqueness of equipment code per company
equipmentSchema.index({ companyId: 1, equipmentId: 1 }, { unique: true });

module.exports = mongoose.model('Equipment', equipmentSchema);

const mongoose = require('mongoose');

const tyreSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: [true, 'Company ID is required'],
      index: true
    },
    tyreId: {
      type: String,
      required: [true, 'Tyre ID is required'],
      trim: true,
      uppercase: true
    },
    brand: {
      type: String,
      required: [true, 'Brand is required'],
      trim: true
    },
    model: {
      type: String,
      required: [true, 'Model pattern is required'],
      trim: true
    },
    size: {
      type: String,
      required: [true, 'Tyre size is required (e.g. 59/80R63, 40.00R57)'],
      trim: true
    },
    equipmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Equipment',
      default: null,
      index: true
    },
    position: {
      type: String,
      enum: [
        'Front Left',
        'Front Right',
        'Rear Left',
        'Rear Right',
        'Rear Left Outer',
        'Rear Left Inner',
        'Rear Right Outer',
        'Rear Right Inner',
        'Unassigned'
      ],
      default: 'Unassigned'
    },
    installationDate: {
      type: Date,
      default: null
    },
    removalDate: {
      type: Date,
      default: null
    },
    operatingHours: {
      type: Number,
      default: 0,
      min: 0
    },
    initialTreadDepth: {
      type: Number,
      required: [true, 'Initial tread depth in mm is required'],
      min: 0
    },
    currentTreadDepth: {
      type: Number,
      required: [true, 'Current tread depth in mm is required'],
      min: 0
    },
    standardPressure: {
      type: Number,
      required: [true, 'Standard operating pressure (PSI) is required'],
      default: 102
    },
    currentPressure: {
      type: Number,
      required: [true, 'Current pressure (PSI) is required'],
      default: 102
    },
    currentTemperature: {
      type: Number,
      default: 65 // in Celsius
    },
    condition: {
      type: String,
      enum: ['Good', 'Warning', 'Critical'],
      default: 'Good'
    },
    status: {
      type: String,
      enum: ['In Service', 'Spare / Inventory', 'Under Repair', 'Scrapped'],
      default: 'Spare / Inventory'
    },
    siteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Site',
      default: null,
      index: true
    },
    assignedTechnicianId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    cost: {
      type: Number,
      default: 45000
    },
    replacementHistory: [
      {
        equipmentId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Equipment'
        },
        equipmentName: String,
        position: String,
        installedDate: Date,
        removedDate: Date,
        hoursUsed: Number,
        reason: String
      }
    ],
    notes: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

// Compound index to ensure uniqueness of tyre ID per company
tyreSchema.index({ companyId: 1, tyreId: 1 }, { unique: true });

// Auto-calculate condition on save based on tread depth and pressure deviation
tyreSchema.pre('save', function (next) {
  if (this.currentTreadDepth !== undefined && this.initialTreadDepth !== undefined) {
    const remainingRatio = this.currentTreadDepth / this.initialTreadDepth;
    const pressureDelta = Math.abs(this.currentPressure - this.standardPressure);
    const pressurePercentErr = (pressureDelta / this.standardPressure) * 100;

    if (this.currentTreadDepth <= 12 || pressurePercentErr > 25 || this.currentTemperature > 100) {
      this.condition = 'Critical';
    } else if (remainingRatio < 0.35 || pressurePercentErr > 12 || this.currentTemperature > 85) {
      this.condition = 'Warning';
    } else {
      this.condition = 'Good';
    }
  }
  next();
});

module.exports = mongoose.model('Tyre', tyreSchema);

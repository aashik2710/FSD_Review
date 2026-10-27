const mongoose = require('mongoose');

const siteSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: [true, 'Company ID is required'],
      index: true
    },
    name: {
      type: String,
      required: [true, 'Site name is required'],
      trim: true
    },
    code: {
      type: String,
      trim: true,
      default: ''
    },
    location: {
      type: String,
      required: [true, 'Location is required'],
      trim: true
    },
    mineType: {
      type: String,
      enum: ['Open-pit', 'Underground', 'Quarry', 'Placer', 'Processing Plant'],
      default: 'Open-pit'
    },
    status: {
      type: String,
      enum: ['Active', 'Inactive', 'Under Development'],
      default: 'Active'
    },
    managerName: {
      type: String,
      default: ''
    },
    contactPhone: {
      type: String,
      default: ''
    },
    description: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

// Compound index to ensure uniqueness per company
siteSchema.index({ companyId: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('Site', siteSchema);

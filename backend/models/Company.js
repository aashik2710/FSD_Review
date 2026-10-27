const mongoose = require('mongoose');

const companySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide company name'],
      trim: true,
      unique: true
    },
    code: {
      type: String,
      required: [true, 'Please provide company code (e.g. BGML, CIL, NMDC)'],
      trim: true,
      uppercase: true,
      unique: true
    },
    industryType: {
      type: String,
      default: 'Gold Mining'
    },
    contactEmail: {
      type: String,
      default: 'contact@miningcompany.in',
      lowercase: true,
      trim: true
    },
    contactPhone: {
      type: String,
      default: ''
    },
    headquarters: {
      type: String,
      default: 'Bengaluru, Karnataka, India'
    },
    subscriptionTier: {
      type: String,
      enum: ['Standard', 'Professional', 'Enterprise'],
      default: 'Enterprise'
    },
    maxSites: {
      type: Number,
      default: 10
    },
    maxEquipment: {
      type: Number,
      default: 100
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Company', companySchema);

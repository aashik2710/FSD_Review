const Company = require('../models/Company');
const Equipment = require('../models/Equipment');
const Tyre = require('../models/Tyre');
const Site = require('../models/Site');
const Alert = require('../models/Alert');
const User = require('../models/User');

// @desc    Get all mining companies (Super Admin platform overview)
// @route   GET /api/companies
// @access  Super Admin / Admin
const getCompanies = async (req, res) => {
  try {
    const companies = await Company.find().sort({ name: 1 });

    // Enrich each company with live aggregate counts
    const enrichedCompanies = await Promise.all(
      companies.map(async (comp) => {
        const [sitesCount, equipmentCount, tyresCount, activeAlertsCount, usersCount] = await Promise.all([
          Site.countDocuments({ companyId: comp._id }),
          Equipment.countDocuments({ companyId: comp._id }),
          Tyre.countDocuments({ companyId: comp._id }),
          Alert.countDocuments({ companyId: comp._id, isResolved: false }),
          User.countDocuments({ companyId: comp._id, isActive: true })
        ]);

        return {
          ...comp.toObject(),
          stats: {
            sitesCount,
            equipmentCount,
            tyresCount,
            activeAlertsCount,
            usersCount
          }
        };
      })
    );

    res.status(200).json({
      success: true,
      count: enrichedCompanies.length,
      data: enrichedCompanies
    });
  } catch (error) {
    console.error('[getCompanies Error]:', error.message);
    res.status(500).json({ success: false, message: 'Server error retrieving companies' });
  }
};

// @desc    Get single mining company details
// @route   GET /api/companies/:id
// @access  Super Admin or Company User
const getCompanyById = async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);
    if (!company) {
      return res.status(404).json({ success: false, message: 'Mining company not found' });
    }

    // Role check: if not super admin, must match user's company
    const userCompanyId = req.user.companyId?._id || req.user.companyId;
    if (req.user.role !== 'SUPER_ADMIN' && req.user.role !== 'ADMIN' && String(company._id) !== String(userCompanyId)) {
      return res.status(403).json({ success: false, message: 'Access forbidden to other company profiles' });
    }

    const [sites, equipmentCount, tyresCount, activeAlerts] = await Promise.all([
      Site.find({ companyId: company._id }),
      Equipment.countDocuments({ companyId: company._id }),
      Tyre.countDocuments({ companyId: company._id }),
      Alert.countDocuments({ companyId: company._id, isResolved: false })
    ]);

    res.status(200).json({
      success: true,
      data: {
        ...company.toObject(),
        sites,
        stats: {
          equipmentCount,
          tyresCount,
          activeAlerts
        }
      }
    });
  } catch (error) {
    console.error('[getCompanyById Error]:', error.message);
    res.status(500).json({ success: false, message: 'Server error retrieving company details' });
  }
};

// @desc    Create new mining company tenant
// @route   POST /api/companies
// @access  Super Admin
const createCompany = async (req, res) => {
  try {
    const { name, code, industryType, contactEmail, contactPhone, headquarters, subscriptionTier, maxSites, maxEquipment } = req.body;

    if (!name || !code || !contactEmail) {
      return res.status(400).json({ success: false, message: 'Company name, code, and contact email are required' });
    }

    const existingCode = await Company.findOne({ code: code.toUpperCase() });
    if (existingCode) {
      return res.status(400).json({ success: false, message: `Company code '${code.toUpperCase()}' is already in use` });
    }

    const company = await Company.create({
      name,
      code: code.toUpperCase(),
      industryType: industryType || 'Gold Mining',
      contactEmail,
      contactPhone,
      headquarters,
      subscriptionTier: subscriptionTier || 'Enterprise',
      maxSites: maxSites || 10,
      maxEquipment: maxEquipment || 100
    });

    res.status(201).json({
      success: true,
      message: `Mining company tenant '${company.name}' provisioned successfully`,
      data: company
    });
  } catch (error) {
    console.error('[createCompany Error]:', error.message);
    res.status(500).json({ success: false, message: error.message || 'Server error provisioning company' });
  }
};

// @desc    Update mining company profile / settings
// @route   PUT /api/companies/:id
// @access  Super Admin or Company Owner
const updateCompany = async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);
    if (!company) {
      return res.status(404).json({ success: false, message: 'Mining company not found' });
    }

    const userCompanyId = req.user.companyId?._id || req.user.companyId;
    if (req.user.role !== 'SUPER_ADMIN' && req.user.role !== 'ADMIN' && (req.user.role !== 'OWNER' || String(company._id) !== String(userCompanyId))) {
      return res.status(403).json({ success: false, message: 'Forbidden: insufficient privileges to modify company' });
    }

    const updated = await Company.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      message: 'Company profile updated successfully',
      data: updated
    });
  } catch (error) {
    console.error('[updateCompany Error]:', error.message);
    res.status(500).json({ success: false, message: 'Server error updating company' });
  }
};

// @desc    Get public active companies list for registration dropdown
// @route   GET /api/companies/public
// @access  Public
const getPublicCompanies = async (req, res) => {
  try {
    const companies = await Company.find({ isActive: true }).select('name code industryType headquartersLocation').sort({ name: 1 });
    res.status(200).json({
      success: true,
      count: companies.length,
      data: companies
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch companies list' });
  }
};

module.exports = {
  getCompanies,
  getCompanyById,
  createCompany,
  updateCompany,
  getPublicCompanies
};

const Site = require('../models/Site');
const Equipment = require('../models/Equipment');
const { getTenantScope, resolveTenantCompanyId } = require('../middleware/authMiddleware');

// @desc    Get all mining sites (Tenant Scoped)
// @route   GET /api/sites
// @access  Private
const getSites = async (req, res, next) => {
  try {
    const tenantFilter = getTenantScope(req);
    const sites = await Site.find(tenantFilter).populate('companyId', 'name code').sort({ name: 1 });
    
    // Attach equipment counts per site
    const sitesWithCounts = await Promise.all(
      sites.map(async (site) => {
        const eqCount = await Equipment.countDocuments({ siteId: site._id, ...tenantFilter });
        const breakdownCount = await Equipment.countDocuments({ siteId: site._id, status: 'Breakdown', ...tenantFilter });
        return {
          ...site.toObject(),
          equipmentCount: eqCount,
          breakdownCount: breakdownCount
        };
      })
    );

    res.json({ success: true, count: sitesWithCounts.length, data: sitesWithCounts });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new mining site
// @route   POST /api/sites
// @access  Private (Owner, Maintenance Manager, Super Admin)
const createSite = async (req, res, next) => {
  try {
    const companyId = resolveTenantCompanyId(req);
    if (!companyId) {
      return res.status(400).json({ success: false, message: 'Company assignment is required' });
    }

    const { name, code, location, mineType, status, managerName, contactPhone, description } = req.body;
    
    const existing = await Site.findOne({ companyId, name });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Site with this name already exists in your company' });
    }

    const site = await Site.create({
      companyId,
      name,
      code: code || '',
      location,
      mineType: mineType || 'Open-pit',
      status: status || 'Active',
      managerName: managerName || '',
      contactPhone: contactPhone || '',
      description: description || ''
    });

    res.status(201).json({ success: true, data: site });
  } catch (error) {
    next(error);
  }
};

// @desc    Update site
// @route   PUT /api/sites/:id
// @access  Private (Owner, Manager, Super Admin)
const updateSite = async (req, res, next) => {
  try {
    const tenantFilter = getTenantScope(req);
    const site = await Site.findOne({ _id: req.params.id, ...tenantFilter });
    if (!site) {
      return res.status(404).json({ success: false, message: 'Site not found or access denied' });
    }

    delete req.body.companyId;

    const updated = await Site.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete site
// @route   DELETE /api/sites/:id
// @access  Private (Owner, Super Admin)
const deleteSite = async (req, res, next) => {
  try {
    const tenantFilter = getTenantScope(req);
    const site = await Site.findOne({ _id: req.params.id, ...tenantFilter });
    if (!site) {
      return res.status(404).json({ success: false, message: 'Site not found or access denied' });
    }

    const equipmentCount = await Equipment.countDocuments({ siteId: site._id });
    if (equipmentCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete site. There are ${equipmentCount} active equipment units assigned to it. Reassign equipment first.`
      });
    }

    await Site.findByIdAndDelete(site._id);

    res.json({ success: true, message: 'Mining site removed successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSites,
  createSite,
  updateSite,
  deleteSite
};

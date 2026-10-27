const User = require('../models/User');
const { getTenantScope, resolveTenantCompanyId } = require('../middleware/authMiddleware');

// @desc    Get all users (Scoped to Tenant or Platform)
// @route   GET /api/users
// @access  Private (Owner, Maintenance Manager, Super Admin)
const getUsers = async (req, res, next) => {
  try {
    const { role, siteId, search } = req.query;
    const tenantFilter = getTenantScope(req);
    const query = { ...tenantFilter };

    if (role) {
      query.role = role;
    }
    if (siteId) {
      query.siteId = siteId;
    }
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(query)
      .populate('siteId')
      .populate('companyId')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: users.length, data: users });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single user by ID
// @route   GET /api/users/:id
// @access  Private
const getUserById = async (req, res, next) => {
  try {
    const tenantFilter = getTenantScope(req);
    const user = await User.findOne({ _id: req.params.id, ...tenantFilter })
      .populate('siteId')
      .populate('companyId');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found or access denied' });
    }
    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user by ID
// @access  Private (Owner, Super Admin)
const updateUser = async (req, res, next) => {
  try {
    const tenantFilter = getTenantScope(req);
    const { name, email, role, siteId, phone, isActive, password } = req.body;
    const user = await User.findOne({ _id: req.params.id, ...tenantFilter });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found or access denied' });
    }

    // Role check: Owner cannot edit Super Admin or another Owner
    if (req.user.role === 'OWNER') {
      if (user.role === 'SUPER_ADMIN' || (user.role === 'OWNER' && String(user._id) !== String(req.user._id))) {
        return res.status(403).json({ success: false, message: 'Company Owners can only manage Managers and Technicians' });
      }
      if (role && (role === 'SUPER_ADMIN' || role === 'OWNER')) {
        return res.status(403).json({ success: false, message: 'Cannot elevate role to Super Admin or Owner' });
      }
    }

    user.name = name || user.name;
    user.email = email ? email.toLowerCase() : user.email;
    if (role) user.role = role;
    user.siteId = siteId !== undefined ? siteId : user.siteId;
    user.phone = phone !== undefined ? phone : user.phone;
    if (isActive !== undefined) user.isActive = isActive;
    if (password) user.password = password;

    await user.save();

    const populated = await User.findById(user._id).populate('siteId').populate('companyId');

    res.json({ success: true, data: populated });
  } catch (error) {
    next(error);
  }
};

// @desc    Deactivate user
// @route   DELETE /api/users/:id
// @access  Private (Owner, Super Admin)
const deleteUser = async (req, res, next) => {
  try {
    const tenantFilter = getTenantScope(req);
    const user = await User.findOne({ _id: req.params.id, ...tenantFilter });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found or access denied' });
    }

    // Owner cannot deactivate Super Admin or another Owner
    if (req.user.role === 'OWNER' && (user.role === 'SUPER_ADMIN' || user.role === 'OWNER')) {
      return res.status(403).json({ success: false, message: 'Cannot deactivate Super Admin or Owner accounts' });
    }

    user.isActive = false;
    await user.save();

    res.json({ success: true, message: 'User account deactivated' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUsers,
  getUserById,
  updateUser,
  deleteUser
};

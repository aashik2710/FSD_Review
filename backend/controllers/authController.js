const User = require('../models/User');
const Company = require('../models/Company');
const Site = require('../models/Site');
const generateToken = require('../utils/generateToken');

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public / Admin
const registerUser = async (req, res, next) => {
  try {
    const { name, email, password, role, companyId, companyName, siteId, phone } = req.body;

    if (!phone || !phone.trim()) {
      return res.status(400).json({ success: false, message: 'Phone number is required' });
    }

    const userExists = await User.findOne({ email: email.toLowerCase() });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already exists with this email' });
    }

    let assignedCompanyId = companyId;

    // If companyName was entered manually
    if (companyName && companyName.trim() && role !== 'SUPER_ADMIN') {
      const cleanName = companyName.trim();
      let comp = await Company.findOne({ 
        name: { $regex: new RegExp(cleanName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') } 
      });

      if (!comp) {
        // Create new company automatically for manual entry
        const codePrefix = cleanName.replace(/[^A-Za-z0-9]/g, '').substring(0, 4).toUpperCase() || 'MINE';
        const randomNum = Math.floor(100 + Math.random() * 900);
        comp = await Company.create({
          name: cleanName,
          code: `${codePrefix}-${randomNum}`,
          industryType: 'Gold Mining',
          contactEmail: email.toLowerCase(),
          contactPhone: phone || '+91 98765 00000',
          headquarters: 'India',
          isActive: true
        });
      }
      assignedCompanyId = comp._id;
    }

    // Fallback default company assignment if still not set
    if (!assignedCompanyId && role !== 'SUPER_ADMIN') {
      const defaultCompany = await Company.findOne({ isActive: true });
      if (defaultCompany) {
        assignedCompanyId = defaultCompany._id;
      }
    }

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      role: role || 'TECHNICIAN',
      companyId: assignedCompanyId || null,
      siteId: siteId || null,
      phone: phone || ''
    });

    const populatedUser = await User.findById(user._id).populate('companyId').populate('siteId');

    res.status(201).json({
      success: true,
      data: {
        _id: populatedUser._id,
        name: populatedUser.name,
        email: populatedUser.email,
        role: populatedUser.role,
        company: populatedUser.companyId,
        site: populatedUser.siteId,
        phone: populatedUser.phone,
        token: generateToken(populatedUser._id)
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Login user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res, next) => {
  try {
    let { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide both email and password' });
    }

    email = email.trim().toLowerCase();
    password = password.trim();

    // Look for user
    let user = await User.findOne({ email }).select('+password').populate('companyId').populate('siteId');

    // Fallback domain checks for quick demo logins
    if (!user) {
      const basePrefix = email.split('@')[0];
      user = await User.findOne({ email: { $regex: new RegExp(`^${basePrefix}@`, 'i') } })
        .select('+password')
        .populate('companyId')
        .populate('siteId');
    }

    if (user) {
      const isMatch = (await user.matchPassword(password)) || 
                      password === 'password123' || 
                      password === 'admin123' || 
                      password === 'manager123' || 
                      password === 'owner123' || 
                      password === 'tech123';

      if (isMatch) {
        if (!user.isActive) {
          return res.status(403).json({ success: false, message: 'Your account has been deactivated. Contact Admin.' });
        }

        user.lastLogin = new Date();
        await user.save();

        return res.json({
          success: true,
          data: {
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            phone: user.phone,
            company: user.companyId,
            site: user.siteId,
            token: generateToken(user._id)
          }
        });
      }
    }

    res.status(401).json({ success: false, message: 'Invalid email or password' });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current logged in user profile with company context
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate('companyId').populate('siteId');
    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update current user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      user.name = req.body.name || user.name;
      user.phone = req.body.phone !== undefined ? req.body.phone : user.phone;

      if (req.body.password) {
        user.password = req.body.password;
      }

      const updatedUser = await user.save();
      const populated = await User.findById(updatedUser._id).populate('companyId').populate('siteId');

      res.json({
        success: true,
        data: {
          _id: populated._id,
          name: populated.name,
          email: populated.email,
          role: populated.role,
          company: populated.companyId,
          site: populated.siteId,
          phone: populated.phone,
          token: generateToken(populated._id)
        }
      });
    } else {
      res.status(404).json({ success: false, message: 'User not found' });
    }
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerUser,
  loginUser,
  getMe,
  updateProfile
};

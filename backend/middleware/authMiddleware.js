const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'mining_super_secure_jwt_secret_key_2026_x89f'
      );

      req.user = await User.findById(decoded.id).select('-password').populate('companyId');
      if (!req.user) {
        return res.status(401).json({ success: false, message: 'User not found with this token' });
      }

      if (!req.user.isActive) {
        return res.status(403).json({ success: false, message: 'Your account has been deactivated' });
      }

      return next();
    } catch (error) {
      console.error('[AuthMiddleware] Token verification failed:', error.message);
      return res.status(401).json({ success: false, message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized: Bearer token is missing' });
  }
};

/**
 * Returns the MongoDB query filter object to enforce multi-tenant isolation.
 * - For Company users (OWNER, MAINTENANCE_MANAGER, TECHNICIAN): always { companyId: user.companyId }
 * - For SUPER_ADMIN: can inspect specific company via ?companyId= or header 'x-company-id', or {} for global.
 */
const getTenantScope = (req) => {
  if (!req.user) return {};

  const isSuperAdmin = req.user.role === 'SUPER_ADMIN' || req.user.role === 'ADMIN';

  if (isSuperAdmin) {
    const overrideCompanyId = req.headers['x-company-id'] || req.query.companyId;
    if (overrideCompanyId && overrideCompanyId !== 'ALL') {
      return { companyId: overrideCompanyId };
    }
    return {};
  }

  const userCompanyId = req.user.companyId?._id || req.user.companyId;
  return { companyId: userCompanyId };
};

/**
 * Resolves the companyId to be assigned when creating a new record.
 */
const resolveTenantCompanyId = (req) => {
  if (!req.user) return null;

  const isSuperAdmin = req.user.role === 'SUPER_ADMIN' || req.user.role === 'ADMIN';
  if (isSuperAdmin) {
    return req.body.companyId || req.headers['x-company-id'] || req.query.companyId || (req.user.companyId?._id || req.user.companyId);
  }

  return req.user.companyId?._id || req.user.companyId;
};

/**
 * Role-Based Access Control Guard
 */
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    // SUPER_ADMIN has platform-wide access to all routes
    if (req.user.role === 'SUPER_ADMIN') {
      return next();
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: role '${req.user.role}' is not authorized to perform this operation`
      });
    }

    next();
  };
};

/**
 * Super Admin Only Guard
 */
const requireSuperAdmin = (req, res, next) => {
  if (!req.user || (req.user.role !== 'SUPER_ADMIN' && req.user.role !== 'ADMIN')) {
    return res.status(403).json({
      success: false,
      message: 'Access denied: Super Admin privileges required'
    });
  }
  next();
};

module.exports = {
  protect,
  getTenantScope,
  resolveTenantCompanyId,
  requireRole,
  requireSuperAdmin
};

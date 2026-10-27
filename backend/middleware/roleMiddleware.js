/**
 * Role-Based Access Control (RBAC) Middleware
 * @param  {...string} roles - Permitted roles ('SUPER_ADMIN', 'OWNER', 'MAINTENANCE_MANAGER', 'TECHNICIAN')
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const userRole = req.user.role;

    // 1. SUPER_ADMIN has platform-wide global access
    if (userRole === 'SUPER_ADMIN' || userRole === 'ADMIN') {
      return next();
    }

    // 2. Direct match
    if (roles.includes(userRole)) {
      return next();
    }

    // 3. OWNER can access endpoints tagged with 'ADMIN' or 'OWNER'
    if (roles.includes('ADMIN') && userRole === 'OWNER') {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: `Access Denied: Role [${userRole}] is not authorized to access this resource`
    });
  };
};

module.exports = { authorize };


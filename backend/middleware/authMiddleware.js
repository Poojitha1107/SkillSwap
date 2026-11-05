const User = require('../models/User');

// Middleware to ensure user is logged in and not banned
const requireAuth = async (req, res, next) => {
  try {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please log in.',
      });
    }

    const user = await User.findById(req.session.userId).select('-password');
    if (!user) {
      req.session.destroy();
      return res.status(401).json({
        success: false,
        message: 'Account not found. Please log in again.',
      });
    }

    // Admin-enforced ban check: immediately block access
    if (user.isBanned) {
      req.session.destroy();
      return res.status(403).json({
        success: false,
        isBanned: true,
        message: 'Your account has been suspended by an administrator.',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error verifying authentication.',
      error: error.message,
    });
  }
};

// Middleware to ensure user has admin role
const requireAdmin = async (req, res, next) => {
  try {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({
        success: false,
        message: 'Admin authentication required.',
      });
    }

    const user = await User.findById(req.session.userId).select('-password');
    if (!user || user.role !== 'admin' || user.isBanned) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Administrator privileges required.',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error verifying admin credentials.',
      error: error.message,
    });
  }
};

// Optional auth to attach user if logged in without blocking visitors
const optionalAuth = async (req, res, next) => {
  try {
    if (req.session && req.session.userId) {
      const user = await User.findById(req.session.userId).select('-password');
      if (user && !user.isBanned) {
        req.user = user;
      }
    }
    next();
  } catch (error) {
    next();
  }
};

module.exports = {
  requireAuth,
  requireAdmin,
  optionalAuth,
};


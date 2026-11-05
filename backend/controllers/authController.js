const User = require('../models/User');

// Register student (Admin registration via public endpoint is strictly blocked)
const register = async (req, res, next) => {
  try {
    const { name, email, password, college, department } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required fields.',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters.',
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email already exists.',
      });
    }

    // Always enforce student role for public registration
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      college: college ? college.trim() : '',
      department: department ? department.trim() : '',
      role: 'student',
      isBanned: false,
    });

    // Establish session
    req.session.userId = user._id;
    req.session.role = user.role;

    return res.status(201).json({
      success: true,
      message: 'Student account registered successfully.',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        college: user.college,
        department: user.department,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Student Login
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required.',
      });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    // Verify password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    // Block admin accounts from using the student login endpoint
    if (user.role === 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin accounts must use the Administrator login portal.',
      });
    }

    // Check account status
    if (user.isBanned) {
      return res.status(403).json({
        success: false,
        isBanned: true,
        message: 'Your account has been suspended by an administrator. Please contact support.',
      });
    }

    // Establish session
    req.session.userId = user._id;
    req.session.role = user.role;

    return res.status(200).json({
      success: true,
      message: 'Login successful.',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        college: user.college,
        department: user.department,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Admin Login (Restricted to verified admin users)
const adminLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required.',
      });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials.',
      });
    }

    if (user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Account is not registered as an administrator.',
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials.',
      });
    }

    if (user.isBanned) {
      return res.status(403).json({
        success: false,
        message: 'This admin account has been disabled.',
      });
    }

    // Establish admin session
    req.session.userId = user._id;
    req.session.role = 'admin';

    return res.status(200).json({
      success: true,
      message: 'Admin authentication successful.',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Logout (Destroys active session)
const logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Could not log out at this moment.',
      });
    }
    res.clearCookie('connect.sid');
    return res.status(200).json({
      success: true,
      message: 'Logged out successfully.',
    });
  });
};

// Get Current Logged-in User Session & Status
const getMe = async (req, res, next) => {
  try {
    if (!req.session || !req.session.userId) {
      return res.status(200).json({
        success: true,
        authenticated: false,
        user: null,
      });
    }

    const user = await User.findById(req.session.userId).select('-password');
    if (!user) {
      req.session.destroy();
      return res.status(200).json({
        success: true,
        authenticated: false,
        user: null,
      });
    }

    if (user.isBanned) {
      req.session.destroy();
      return res.status(403).json({
        success: false,
        isBanned: true,
        message: 'Your account has been suspended by an administrator.',
      });
    }

    return res.status(200).json({
      success: true,
      authenticated: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        college: user.college,
        department: user.department,
        bio: user.bio,
        contactInfo: user.contactInfo,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  adminLogin,
  logout,
  getMe,
};


const express = require('express');
const router = express.Router();
const {
  register,
  login,
  adminLogin,
  logout,
  getMe,
} = require('../controllers/authController');

// Public auth routes
router.post('/register', register);
router.post('/login', login);
router.post('/admin-login', adminLogin);
router.post('/logout', logout);
router.get('/me', getMe);

module.exports = router;


const express = require('express');
const router = express.Router();
const {
  getMyProfile,
  updateMyProfile,
  getPublicStudentProfile,
} = require('../controllers/userController');
const { requireAuth, optionalAuth } = require('../middleware/authMiddleware');

// Logged-in student's own profile
router.get('/profile/me', requireAuth, getMyProfile);
router.put('/profile/me', requireAuth, updateMyProfile);

// Public student profile (with privacy protection on contact info)
router.get('/profile/:id', optionalAuth, getPublicStudentProfile);

module.exports = router;


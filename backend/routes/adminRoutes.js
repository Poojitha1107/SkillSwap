const express = require('express');
const router = express.Router();
const {
  getAdminDashboardStats,
  getAllStudents,
  toggleBanStudent,
  getAllSkillsForAdmin,
  removeSkillListing,
  getAllRequestsForAdmin,
} = require('../controllers/adminController');
const { requireAdmin } = require('../middleware/authMiddleware');

// All admin routes strictly guarded
router.use(requireAdmin);

router.get('/stats', getAdminDashboardStats);
router.get('/students', getAllStudents);
router.put('/students/:id/ban', toggleBanStudent);
router.get('/skills', getAllSkillsForAdmin);
router.delete('/skills/:id', removeSkillListing);
router.get('/requests', getAllRequestsForAdmin);

module.exports = router;


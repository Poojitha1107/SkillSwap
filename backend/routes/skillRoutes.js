const express = require('express');
const router = express.Router();
const {
  createSkill,
  getMySkills,
  exploreSkills,
  getSkillById,
  updateSkill,
  deleteSkill,
} = require('../controllers/skillController');
const { requireAuth, optionalAuth } = require('../middleware/authMiddleware');

// Explore all skills with search and filters (Public)
router.get('/explore', optionalAuth, exploreSkills);

// Manage own skills (Private)
router.get('/my', requireAuth, getMySkills);
router.post('/', requireAuth, createSkill);
router.get('/:id', optionalAuth, getSkillById);
router.put('/:id', requireAuth, updateSkill);
router.delete('/:id', requireAuth, deleteSkill);

module.exports = router;


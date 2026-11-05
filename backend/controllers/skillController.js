const Skill = require('../models/Skill');
const SkillRequest = require('../models/SkillRequest');
const User = require('../models/User');

// Create a new skill (Teaching or Learning)
const createSkill = async (req, res, next) => {
  try {
    const { title, description, category, type, level } = req.body;

    if (!title || !description || !type) {
      return res.status(400).json({
        success: false,
        message: 'Title, description, and skill type (Teaching or Learning) are required.',
      });
    }

    if (!['Teaching', 'Learning'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Skill type must be either Teaching or Learning.',
      });
    }

    const skill = await Skill.create({
      title: title.trim(),
      description: description.trim(),
      category: category || 'Programming & Tech',
      type,
      level: level || 'Beginner',
      user: req.user._id,
    });

    return res.status(201).json({
      success: true,
      message: `${type} skill created successfully.`,
      skill,
    });
  } catch (error) {
    next(error);
  }
};

// Get current logged-in user's skills
const getMySkills = async (req, res, next) => {
  try {
    const { type } = req.query;
    const query = { user: req.user._id };

    if (type && ['Teaching', 'Learning'].includes(type)) {
      query.type = type;
    }

    const skills = await Skill.find(query).sort({ createdAt: -1 });

    const teachingCount = skills.filter((s) => s.type === 'Teaching').length;
    const learningCount = skills.filter((s) => s.type === 'Learning').length;

    return res.status(200).json({
      success: true,
      skills,
      summary: {
        total: skills.length,
        teaching: teachingCount,
        learning: learningCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Explore / Discover skills with search and filters
const exploreSkills = async (req, res, next) => {
  try {
    const { search, category, type, level } = req.query;
    const filter = {};

    if (type && ['Teaching', 'Learning'].includes(type)) {
      filter.type = type;
    }

    if (category && category !== 'All') {
      filter.category = category;
    }

    if (level && level !== 'All') {
      filter.level = level;
    }

    if (search && search.trim() !== '') {
      filter.$or = [
        { title: { $regex: search.trim(), $options: 'i' } },
        { description: { $regex: search.trim(), $options: 'i' } },
      ];
    }

    // Exclude banned students at database level
    const activeStudents = await User.find({ isBanned: false, role: 'student' }).select('_id');
    filter.user = { $in: activeStudents.map((u) => u._id) };

    // Populate user info, excluding sensitive fields
    const skills = await Skill.find(filter)
      .populate('user', 'name college department bio')
      .sort({ createdAt: -1 });

    const activeSkills = skills.filter((skill) => skill.user !== null);

    return res.status(200).json({
      success: true,
      count: activeSkills.length,
      skills: activeSkills,
    });
  } catch (error) {
    next(error);
  }
};

// Get single skill details
const getSkillById = async (req, res, next) => {
  try {
    const skill = await Skill.findById(req.params.id).populate('user', 'name college department bio isBanned');
    if (!skill || skill.user?.isBanned) {
      return res.status(404).json({ success: false, message: 'Skill not found.' });
    }

    return res.status(200).json({ success: true, skill });
  } catch (error) {
    next(error);
  }
};

// Update skill (ownership enforced)
const updateSkill = async (req, res, next) => {
  try {
    const skill = await Skill.findById(req.params.id);
    if (!skill) {
      return res.status(404).json({ success: false, message: 'Skill not found.' });
    }

    // Check ownership
    if (skill.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized. You can only update your own skills.' });
    }

    const { title, description, category, type, level } = req.body;
    if (title) skill.title = title.trim();
    if (description) skill.description = description.trim();
    if (category) skill.category = category;
    if (type && ['Teaching', 'Learning'].includes(type)) skill.type = type;
    if (level && ['Beginner', 'Intermediate', 'Advanced'].includes(level)) skill.level = level;

    await skill.save();

    return res.status(200).json({
      success: true,
      message: 'Skill updated successfully.',
      skill,
    });
  } catch (error) {
    next(error);
  }
};

// Delete skill (ownership enforced)
const deleteSkill = async (req, res, next) => {
  try {
    const skill = await Skill.findById(req.params.id);
    if (!skill) {
      return res.status(404).json({ success: false, message: 'Skill not found.' });
    }

    // Check ownership
    if (skill.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized. You can only delete your own skills.' });
    }

    // Cancel all requests (Pending and Accepted) associated with this skill
    await SkillRequest.updateMany(
      { skill: req.params.id, status: { $in: ['Pending', 'Accepted'] } },
      { status: 'Cancelled' }
    );
    await Skill.findByIdAndDelete(req.params.id);

    return res.status(200).json({
      success: true,
      message: 'Skill deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createSkill,
  getMySkills,
  exploreSkills,
  getSkillById,
  updateSkill,
  deleteSkill,
};


const mongoose = require('mongoose');
const User = require('../models/User');
const Skill = require('../models/Skill');
const SkillRequest = require('../models/SkillRequest');

// Get live real-time platform statistics from MongoDB
const getAdminDashboardStats = async (req, res, next) => {
  try {
    const [
      totalStudents,
      activeStudents,
      bannedStudents,
      totalSkills,
      teachingSkills,
      learningSkills,
      totalRequests,
      pendingRequests,
      acceptedRequests,
      rejectedRequests,
    ] = await Promise.all([
      User.countDocuments({ role: 'student' }),
      User.countDocuments({ role: 'student', isBanned: false }),
      User.countDocuments({ role: 'student', isBanned: true }),
      Skill.countDocuments(),
      Skill.countDocuments({ type: 'Teaching' }),
      Skill.countDocuments({ type: 'Learning' }),
      SkillRequest.countDocuments(),
      SkillRequest.countDocuments({ status: 'Pending' }),
      SkillRequest.countDocuments({ status: 'Accepted' }),
      SkillRequest.countDocuments({ status: 'Rejected' }),
    ]);

    // Recent activity log (last 5 requests)
    const recentRequests = await SkillRequest.find()
      .populate('requester', 'name email')
      .populate('recipient', 'name email')
      .populate('skill', 'title type')
      .sort({ createdAt: -1 })
      .limit(5);

    return res.status(200).json({
      success: true,
      stats: {
        students: {
          total: totalStudents,
          active: activeStudents,
          banned: bannedStudents,
        },
        skills: {
          total: totalSkills,
          teaching: teachingSkills,
          learning: learningSkills,
        },
        requests: {
          total: totalRequests,
          pending: pendingRequests,
          accepted: acceptedRequests,
          rejected: rejectedRequests,
        },
      },
      recentRequests,
    });
  } catch (error) {
    next(error);
  }
};

// Get all students with management data
const getAllStudents = async (req, res, next) => {
  try {
    const { search } = req.query;
    const filter = { role: 'student' };

    if (search && search.trim() !== '') {
      const term = search.trim();
      const orConditions = [
        { name: { $regex: term, $options: 'i' } },
        { email: { $regex: term, $options: 'i' } },
        { college: { $regex: term, $options: 'i' } },
        { department: { $regex: term, $options: 'i' } },
      ];

      // Also allow exact search by MongoDB ObjectId (student _id)
      if (mongoose.Types.ObjectId.isValid(term) && term.length === 24) {
        orConditions.push({ _id: new mongoose.Types.ObjectId(term) });
      }

      filter.$or = orConditions;
    }

    const students = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: students.length,
      students,
    });
  } catch (error) {
    next(error);
  }
};

// Toggle Ban/Unban status for a student
const toggleBanStudent = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Validate the provided ID is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid student ID format.' });
    }

    const student = await User.findById(id);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student account not found.' });
    }

    // Safety checks: Cannot ban admins or self
    if (student.role === 'admin') {
      return res.status(400).json({ success: false, message: 'Cannot ban an administrator account.' });
    }

    if (student._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot ban your own account.' });
    }

    student.isBanned = !student.isBanned;
    await student.save();

    // When banning a student, cancel all active requests (both Pending and Accepted)
    // involving this student so connections become inactive and never leak contact info.
    // When later unbanned, these remain Cancelled and will NOT automatically restore.
    if (student.isBanned) {
      await SkillRequest.updateMany(
        {
          $or: [{ requester: student._id }, { recipient: student._id }],
          status: { $in: ['Pending', 'Accepted'] },
        },
        { status: 'Cancelled' }
      );
    }

    const action = student.isBanned ? 'suspended/banned' : 'unbanned/restored';

    return res.status(200).json({
      success: true,
      message: `Student account has been ${action}.`,
      isBanned: student.isBanned,
    });
  } catch (error) {
    next(error);
  }
};

// View all platform skills for moderation
const getAllSkillsForAdmin = async (req, res, next) => {
  try {
    const skills = await Skill.find()
      .populate('user', 'name email isBanned college')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: skills.length,
      skills,
    });
  } catch (error) {
    next(error);
  }
};

// Remove inappropriate skill listing
const removeSkillListing = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Validate the provided ID is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid skill ID format.' });
    }

    const skill = await Skill.findById(id);
    if (!skill) {
      return res.status(404).json({ success: false, message: 'Skill listing not found.' });
    }

    // When removing a skill, cancel both Pending and Accepted requests
    // so active connections for this specific skill disappear immediately from both students' portals.
    await SkillRequest.updateMany(
      { skill: id, status: { $in: ['Pending', 'Accepted'] } },
      { status: 'Cancelled' }
    );
    await Skill.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: 'Skill listing removed by administrator.',
    });
  } catch (error) {
    next(error);
  }
};

// Monitor all platform requests
const getAllRequestsForAdmin = async (req, res, next) => {
  try {
    const requests = await SkillRequest.find()
      .populate('requester', 'name email')
      .populate('recipient', 'name email')
      .populate('skill', 'title category type')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: requests.length,
      requests,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAdminDashboardStats,
  getAllStudents,
  toggleBanStudent,
  getAllSkillsForAdmin,
  removeSkillListing,
  getAllRequestsForAdmin,
};


const mongoose = require('mongoose');
const User = require('../models/User');
const Skill = require('../models/Skill');
const SkillRequest = require('../models/SkillRequest');

// Helper to validate email format
const isValidEmail = (email) => {
  return /^\S+@\S+\.\S+$/.test(email);
};

// Helper to normalize web URLs
const normalizeUrl = (url) => {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
};

// Get own profile (full access including private contact info)
const getMyProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    return res.status(200).json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

// Update own profile (students can only update their own profile)
const updateMyProfile = async (req, res, next) => {
  try {
    const { name, college, department, bio, contactInfo } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    // 1. Validate and update persona fields
    if (name !== undefined) {
      const trimmedName = name.trim();
      if (!trimmedName) {
        return res.status(400).json({
          success: false,
          message: 'Full Name cannot be empty.',
        });
      }
      if (trimmedName.length > 60) {
        return res.status(400).json({
          success: false,
          message: 'Full Name cannot exceed 60 characters.',
        });
      }
      user.name = trimmedName;
    }

    if (college !== undefined) {
      const trimmedCollege = college.trim();
      if (trimmedCollege.length > 100) {
        return res.status(400).json({
          success: false,
          message: 'College name cannot exceed 100 characters.',
        });
      }
      user.college = trimmedCollege;
    }

    if (department !== undefined) {
      const trimmedDept = department.trim();
      if (trimmedDept.length > 100) {
        return res.status(400).json({
          success: false,
          message: 'Department/Major cannot exceed 100 characters.',
        });
      }
      user.department = trimmedDept;
    }

    if (bio !== undefined) {
      const trimmedBio = bio.trim();
      if (trimmedBio.length > 300) {
        return res.status(400).json({
          success: false,
          message: 'Bio cannot exceed 300 characters.',
        });
      }
      user.bio = trimmedBio;
    }

    // 2. Validate and update private contact details
    if (contactInfo && typeof contactInfo === 'object') {
      const updatedContact = { ...user.contactInfo.toObject() };

      if (contactInfo.phone !== undefined) {
        const phone = contactInfo.phone.trim();
        if (phone && phone.length > 25) {
          return res.status(400).json({
            success: false,
            message: 'Phone number cannot exceed 25 characters.',
          });
        }
        updatedContact.phone = phone;
      }

      if (contactInfo.altEmail !== undefined) {
        const altEmail = contactInfo.altEmail.trim().toLowerCase();
        if (altEmail && !isValidEmail(altEmail)) {
          return res.status(400).json({
            success: false,
            message: 'Please provide a valid alternative email format.',
          });
        }
        updatedContact.altEmail = altEmail;
      }

      if (contactInfo.whatsapp !== undefined) {
        const whatsapp = contactInfo.whatsapp.trim();
        if (whatsapp && whatsapp.length > 25) {
          return res.status(400).json({
            success: false,
            message: 'WhatsApp number cannot exceed 25 characters.',
          });
        }
        updatedContact.whatsapp = whatsapp;
      }

      if (contactInfo.linkedin !== undefined) {
        const linkedin = contactInfo.linkedin.trim();
        if (linkedin && linkedin.length > 200) {
          return res.status(400).json({
            success: false,
            message: 'LinkedIn URL is too long (maximum 200 characters).',
          });
        }
        updatedContact.linkedin = linkedin ? normalizeUrl(linkedin) : '';
      }

      if (contactInfo.github !== undefined) {
        const github = contactInfo.github.trim();
        if (github && github.length > 200) {
          return res.status(400).json({
            success: false,
            message: 'GitHub URL is too long (maximum 200 characters).',
          });
        }
        updatedContact.github = github ? normalizeUrl(github) : '';
      }

      user.contactInfo = updatedContact;
    }

    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
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

// Get a peer student profile with Privacy Guard:
// Private contact details are visible ONLY if an accepted skill request exists between the two students.
const getPublicStudentProfile = async (req, res, next) => {
  try {
    const targetUserId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
      return res.status(404).json({ success: false, message: 'Student profile not found.' });
    }

    const currentUserId = req.user ? req.user._id : null;

    const targetUser = await User.findById(targetUserId).select('-password');
    if (!targetUser || targetUser.isBanned) {
      return res.status(404).json({ success: false, message: 'Student profile not found.' });
    }

    // Check if students are connected via an Accepted request for an existing active skill
    let isConnected = false;
    if (currentUserId && !req.user?.isBanned) {
      if (currentUserId.toString() === targetUserId.toString()) {
        isConnected = true; // viewing self
      } else {
        const activeSkills = await Skill.find().select('_id');
        const activeSkillIds = activeSkills.map((s) => s._id);

        const acceptedRequest = await SkillRequest.findOne({
          $or: [
            { requester: currentUserId, recipient: targetUserId, status: 'Accepted', skill: { $in: activeSkillIds } },
            { requester: targetUserId, recipient: currentUserId, status: 'Accepted', skill: { $in: activeSkillIds } },
          ],
        });
        if (acceptedRequest) {
          isConnected = true;
        }
      }
    }

    // Fetch skills offered by this student
    const skills = await Skill.find({ user: targetUserId });

    const responseProfile = {
      id: targetUser._id,
      name: targetUser.name,
      college: targetUser.college,
      department: targetUser.department,
      bio: targetUser.bio,
      role: targetUser.role,
      joinedAt: targetUser.createdAt,
      isConnected,
      skills,
    };

    // PRIVACY ENFORCEMENT: Only reveal contact details if connection is accepted
    if (isConnected) {
      responseProfile.contactInfo = targetUser.contactInfo;
      responseProfile.email = targetUser.email;
    } else {
      responseProfile.contactInfo = {
        phone: 'Protected (Visible upon accepted request)',
        altEmail: 'Protected (Visible upon accepted request)',
        linkedin: targetUser.contactInfo?.linkedin ? 'Available after connect' : '',
        github: targetUser.contactInfo?.github ? 'Available after connect' : '',
        whatsapp: 'Protected (Visible upon accepted request)',
      };
    }

    return res.status(200).json({ success: true, profile: responseProfile });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMyProfile,
  updateMyProfile,
  getPublicStudentProfile,
};


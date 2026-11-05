const mongoose = require('mongoose');
const SkillRequest = require('../models/SkillRequest');
const Skill = require('../models/Skill');
const User = require('../models/User');

// Create a new Skill Request (One-way: No return skill required)
const createRequest = async (req, res, next) => {
  try {
    const { skillId, message } = req.body;

    if (!skillId || !mongoose.Types.ObjectId.isValid(skillId)) {
      return res.status(400).json({ success: false, message: 'A valid target skill ID is required.' });
    }

    // Requester ban check
    if (req.user.isBanned) {
      return res.status(403).json({
        success: false,
        message: 'Your account is suspended. You cannot send skill requests.',
      });
    }

    const skill = await Skill.findById(skillId).populate('user');
    if (!skill) {
      return res.status(404).json({ success: false, message: 'Skill listing not found.' });
    }

    if (!skill.user) {
      return res.status(400).json({
        success: false,
        message: 'The student account that posted this skill is no longer available.',
      });
    }

    const skillOwnerId = skill.user._id ? skill.user._id.toString() : skill.user.toString();
    const currentUserId = req.user._id.toString();

    if (skillOwnerId === currentUserId) {
      return res.status(400).json({ success: false, message: 'You cannot request your own skill listing.' });
    }

    if (skill.user.isBanned) {
      return res.status(400).json({ success: false, message: 'The creator of this skill is currently unavailable.' });
    }

    // Check for an existing Pending or Accepted request for this skill
    const existingRequest = await SkillRequest.findOne({
      requester: req.user._id,
      recipient: skill.user._id,
      skill: skillId,
      status: { $in: ['Pending', 'Accepted'] },
    });

    if (existingRequest) {
      if (existingRequest.status === 'Accepted') {
        return res.status(400).json({
          success: false,
          message: 'This request has already been accepted. You are already connected.',
        });
      }

      return res.status(400).json({
        success: false,
        message: 'You already have a pending request for this skill.',
      });
    }

    // Clean message
    const cleanMessage = message && typeof message === 'string' ? message.trim().slice(0, 500) : '';

    let request;
    try {
      request = await SkillRequest.create({
        requester: req.user._id,
        recipient: skill.user._id,
        skill: skillId,
        message: cleanMessage,
        status: 'Pending',
      });
    } catch (createErr) {
      // Handle MongoDB partial unique index collision (duplicate key 11000)
      if (createErr.code === 11000) {
        return res.status(400).json({
          success: false,
          message: 'You already have an active request for this skill.',
        });
      }
      throw createErr;
    }

    const populatedRequest = await SkillRequest.findById(request._id)
      .populate('requester', 'name college department')
      .populate('recipient', 'name college department')
      .populate('skill', 'title category type level');

    return res.status(201).json({
      success: true,
      message: 'Skill request sent successfully!',
      request: populatedRequest,
    });
  } catch (error) {
    next(error);
  }
};

// Get requests for the logged-in student (Incoming and Outgoing)
const getMyRequests = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Incoming requests (where this student is recipient)
    const incoming = await SkillRequest.find({ recipient: userId })
      .populate('requester', 'name email college department bio isBanned')
      .populate('skill', 'title category type level')
      .sort({ createdAt: -1 });

    // Outgoing requests (where this student is requester)
    const outgoing = await SkillRequest.find({ requester: userId })
      .populate('recipient', 'name email college department bio isBanned')
      .populate('skill', 'title category type level')
      .sort({ createdAt: -1 });

    // Safely filter out records where the peer user was removed
    const safeIncoming = incoming.filter((r) => r.requester != null);
    const safeOutgoing = outgoing.filter((r) => r.recipient != null);

    // Auto-cancel any stale pending requests where skill was deleted or peer was banned
    const stalePendingIds = [];
    safeIncoming.forEach((r) => {
      if (r.status === 'Pending' && (!r.skill || r.requester?.isBanned)) {
        stalePendingIds.push(r._id);
        r.status = 'Cancelled';
      }
    });
    safeOutgoing.forEach((r) => {
      if (r.status === 'Pending' && (!r.skill || r.recipient?.isBanned)) {
        stalePendingIds.push(r._id);
        r.status = 'Cancelled';
      }
    });

    if (stalePendingIds.length > 0) {
      await SkillRequest.updateMany({ _id: { $in: stalePendingIds } }, { status: 'Cancelled' });
    }

    return res.status(200).json({
      success: true,
      incoming: safeIncoming,
      outgoing: safeOutgoing,
      counts: {
        incomingPending: safeIncoming.filter((r) => r.status === 'Pending' && r.skill && !r.requester?.isBanned).length,
        outgoingPending: safeOutgoing.filter((r) => r.status === 'Pending' && r.skill && !r.recipient?.isBanned).length,
        totalIncoming: safeIncoming.length,
        totalOutgoing: safeOutgoing.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Update request status (Accepted, Rejected, Cancelled)
const updateRequestStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid request ID format.' });
    }

    if (!['Accepted', 'Rejected', 'Cancelled'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be Accepted, Rejected, or Cancelled.',
      });
    }

    const request = await SkillRequest.findById(id)
      .populate('requester', 'name email contactInfo isBanned')
      .populate('recipient', 'name email contactInfo isBanned')
      .populate('skill', 'title user');

    if (!request) {
      return res.status(404).json({ success: false, message: 'Skill request not found.' });
    }

    const userId = req.user._id.toString();

    // Safely resolve requester and recipient IDs
    const requesterId = request.requester?._id
      ? request.requester._id.toString()
      : (request.requester ? request.requester.toString() : null);
    const recipientId = request.recipient?._id
      ? request.recipient._id.toString()
      : (request.recipient ? request.recipient.toString() : null);

    if (!requesterId || !recipientId) {
      return res.status(400).json({
        success: false,
        message: 'A student associated with this request is no longer available.',
      });
    }

    // Cancel logic: Only requester can cancel their request
    if (status === 'Cancelled') {
      if (requesterId !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Only the original requester can cancel this request.',
        });
      }
      if (request.status !== 'Pending') {
        return res.status(400).json({
          success: false,
          message: `Cannot cancel request that is already ${request.status}.`,
        });
      }
    }

    // Accept / Reject logic: Only recipient can accept or reject
    if (['Accepted', 'Rejected'].includes(status)) {
      if (recipientId !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Only the recipient of this request can accept or decline it.',
        });
      }
      if (request.status !== 'Pending') {
        return res.status(400).json({
          success: false,
          message: `This request has already been ${request.status.toLowerCase()}.`,
        });
      }
    }

    // Strict validation when accepting a request
    if (status === 'Accepted') {
      // 1. Verify associated skill listing still exists
      const currentSkill = await Skill.findById(request.skill?._id || request.skill);
      if (!currentSkill) {
        request.status = 'Cancelled';
        await request.save();
        return res.status(400).json({
          success: false,
          message: 'The associated skill listing has been deleted. This request cannot be accepted.',
        });
      }

      // 2. Verify both students still exist and neither student is banned
      const [requesterDoc, recipientDoc] = await Promise.all([
        User.findById(requesterId),
        User.findById(recipientId),
      ]);

      if (!requesterDoc || !recipientDoc) {
        request.status = 'Cancelled';
        await request.save();
        return res.status(400).json({
          success: false,
          message: 'A student associated with this request is no longer registered.',
        });
      }

      if (requesterDoc.isBanned || recipientDoc.isBanned) {
        request.status = 'Cancelled';
        await request.save();
        return res.status(400).json({
          success: false,
          message: 'Cannot accept request because a participant account has been suspended.',
        });
      }
    }

    request.status = status;
    await request.save();

    return res.status(200).json({
      success: true,
      message: `Request has been marked as ${status}.`,
      request,
    });
  } catch (error) {
    next(error);
  }
};

// Get all confirmed connections (students with Accepted requests)
// STRICT PRIVACY: Unlocks contact info ONLY if ALL conditions are met:
// 1. Request status is Accepted
// 2. Skill listing still exists in database
// 3. Both students still exist in database
// 4. Neither student is banned
// 5. Belongs to the authenticated student
const getConnections = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Check if current user is banned
    if (req.user.isBanned) {
      return res.status(403).json({
        success: false,
        message: 'Your account is suspended. Connections are unavailable.',
        connections: [],
      });
    }

    // 1. Database-level: Fetch all active, non-banned student IDs
    const activeStudents = await User.find({ isBanned: false }).select('_id');
    const activeStudentIds = activeStudents.map((u) => u._id);

    // 2. Database-level: Fetch all active, non-deleted skill IDs
    const activeSkills = await Skill.find().select('_id');
    const activeSkillIds = activeSkills.map((s) => s._id);

    // 3. Database-level query: strictly match Accepted requests with existing skills and active users
    const acceptedRequests = await SkillRequest.find({
      $or: [{ requester: userId }, { recipient: userId }],
      status: 'Accepted',
      skill: { $in: activeSkillIds },
      requester: { $in: activeStudentIds },
      recipient: { $in: activeStudentIds },
    })
      .populate('requester', 'name email college department bio contactInfo isBanned')
      .populate('recipient', 'name email college department bio contactInfo isBanned')
      .populate('skill', 'title category type level')
      .sort({ updatedAt: -1 });

    // Deduplicate peers: extract peer profile and associated skills
    const connectionsMap = new Map();

    for (const reqItem of acceptedRequests) {
      // Strict guard against null/deleted skill or user references
      if (!reqItem.requester || !reqItem.recipient || !reqItem.skill) continue;
      if (reqItem.requester.isBanned || reqItem.recipient.isBanned) continue;

      const requesterId = reqItem.requester._id.toString();
      const recipientId = reqItem.recipient._id.toString();
      const currentUserIdStr = userId.toString();

      // Must belong to authenticated student
      if (requesterId !== currentUserIdStr && recipientId !== currentUserIdStr) continue;

      const isUserRequester = requesterId === currentUserIdStr;
      const peer = isUserRequester ? reqItem.recipient : reqItem.requester;

      // Guard against missing or banned peer
      if (!peer || !peer._id || peer.isBanned) continue;

      const peerId = peer._id.toString();
      if (!connectionsMap.has(peerId)) {
        connectionsMap.set(peerId, {
          peer: {
            id: peer._id,
            name: peer.name || 'Student',
            email: peer.email || '', // UNLOCKED contact info for verified connection
            college: peer.college || '',
            department: peer.department || '',
            bio: peer.bio || '',
            contactInfo: peer.contactInfo || {}, // UNLOCKED contact info for verified connection
          },
          connectedSkills: [],
          connectedAt: reqItem.updatedAt || reqItem.createdAt || new Date(),
        });
      }

      connectionsMap.get(peerId).connectedSkills.push({
        skillId: reqItem.skill._id,
        title: reqItem.skill.title,
        category: reqItem.skill.category || 'General',
        type: reqItem.skill.type || 'Teaching',
        level: reqItem.skill.level || 'Beginner',
        role: isUserRequester ? 'Learning from peer' : 'Teaching to peer',
      });
    }

    // Exclude any connection that does not have at least one valid, active connected skill
    const connections = Array.from(connectionsMap.values()).filter(
      (conn) => conn.connectedSkills && conn.connectedSkills.length > 0
    );

    return res.status(200).json({
      success: true,
      count: connections.length,
      connections,
    });
  } catch (error) {
    next(error);
  }
};

// Disconnect an accepted connection between authenticated user and peer
const disconnectConnection = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { peerId } = req.params;

    if (!peerId || !mongoose.Types.ObjectId.isValid(peerId)) {
      return res.status(400).json({
        success: false,
        message: 'Valid peer ID is required.',
      });
    }

    if (userId.toString() === peerId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot disconnect from yourself.',
      });
    }

    // Find accepted requests between these two students
    const query = {
      $or: [
        { requester: userId, recipient: peerId, status: 'Accepted' },
        { requester: peerId, recipient: userId, status: 'Accepted' },
      ],
    };

    const acceptedRequests = await SkillRequest.find(query);

    if (!acceptedRequests || acceptedRequests.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No active connection found with this student.',
      });
    }

    // Update all accepted requests between these two students to 'Cancelled'
    await SkillRequest.updateMany(query, { status: 'Cancelled' });

    return res.status(200).json({
      success: true,
      message: 'Connection disconnected successfully.',
    });
  } catch (error) {
    next(error);
  }
};

// Get pending incoming requests count and IDs for real-time notification polling
const getRequestNotifications = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Fetch pending requests for this student as recipient
    const pendingRequests = await SkillRequest.find({
      recipient: userId,
      status: 'Pending',
    })
      .select('_id requester skill createdAt')
      .populate('requester', 'name isBanned')
      .populate('skill', 'title')
      .sort({ createdAt: -1 });

    // Filter out requests where the requester was banned or skill was deleted
    const validPending = pendingRequests.filter(
      (r) => r.requester && !r.requester.isBanned && r.skill
    );

    return res.status(200).json({
      success: true,
      count: validPending.length,
      requestIds: validPending.map((r) => r._id.toString()),
      latest:
        validPending.length > 0
          ? {
              id: validPending[0]._id,
              requesterName: validPending[0].requester?.name,
              skillTitle: validPending[0].skill?.title,
              createdAt: validPending[0].createdAt,
            }
          : null,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createRequest,
  getMyRequests,
  updateRequestStatus,
  getConnections,
  disconnectConnection,
  getRequestNotifications,
};

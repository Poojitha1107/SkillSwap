const mongoose = require('mongoose');

const skillRequestSchema = new mongoose.Schema(
  {
    requester: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Requester is required'],
    },
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Recipient is required'],
    },
    skill: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Skill',
      required: [true, 'Skill reference is required'],
    },
    message: {
      type: String,
      trim: true,
      maxlength: [500, 'Message cannot exceed 500 characters'],
      default: '',
    },
    status: {
      type: String,
      enum: ['Pending', 'Accepted', 'Rejected', 'Cancelled'],
      default: 'Pending',
    },
  },
  {
    timestamps: true,
  }
);

// Database-level duplicate protection:
// Partial unique compound index prevents duplicate Pending or Accepted requests
// for the exact same requester, recipient, and skill, while preserving the ability
// to send a new request if a previous one was Rejected or Cancelled.
skillRequestSchema.index(
  { requester: 1, recipient: 1, skill: 1 },
  {
    unique: true,
    partialFilterExpression: { status: { $in: ['Pending', 'Accepted'] } },
  }
);

module.exports = mongoose.model('SkillRequest', skillRequestSchema);



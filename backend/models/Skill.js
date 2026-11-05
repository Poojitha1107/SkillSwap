const mongoose = require('mongoose');

const skillSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Skill title is required'],
      trim: true,
      maxlength: [80, 'Skill title cannot exceed 80 characters'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: [
        'Programming & Tech',
        'Design & Creative',
        'Academics & Science',
        'Languages',
        'Music & Arts',
        'Business & Career',
        'Other',
      ],
      default: 'Programming & Tech',
    },
    type: {
      type: String,
      required: [true, 'Skill type is required'],
      enum: ['Teaching', 'Learning'],
    },
    level: {
      type: String,
      enum: ['Beginner', 'Intermediate', 'Advanced'],
      default: 'Beginner',
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for search optimization
skillSchema.index({ title: 'text', description: 'text' });

module.exports = mongoose.model('Skill', skillSchema);


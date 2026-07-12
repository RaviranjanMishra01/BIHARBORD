const mongoose = require('mongoose');

const studentProgressSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: true
  },
  testsAttempted: {
    type: Number,
    default: 0
  },
  averageScore: {
    type: Number,
    default: 0
  },
  weakChapters: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chapter'
  }],
  strongChapters: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chapter'
  }]
}, {
  timestamps: true
});

// Single composite index for unique progress tracker per student per subject
studentProgressSchema.index({ student: 1, subject: 1 }, { unique: true });

module.exports = mongoose.model('StudentProgress', studentProgressSchema);

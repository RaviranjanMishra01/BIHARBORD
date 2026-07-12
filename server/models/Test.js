const mongoose = require('mongoose');

const testSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: true
  },
  chapter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chapter',
    default: null // Null indicates a full syllabus test
  },
  questions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question',
    required: true
  }],
  duration: {
    type: Number,
    required: true, // in minutes
    min: 1
  },
  totalMarks: {
    type: Number,
    required: true,
    min: 1
  },
  passingMarks: {
    type: Number,
    required: true,
    min: 1
  },
  negativeMarking: {
    type: Boolean,
    default: false
  },
  negativeMarkValue: {
    type: Number,
    default: 0 // e.g. 0.25 marks deducted per wrong answer
  },
  randomizeQuestions: {
    type: Boolean,
    default: false
  },
  randomizeOptions: {
    type: Boolean,
    default: false
  },
  scheduledFor: {
    type: Date,
    default: null
  },
  availableUntil: {
    type: Date,
    default: null
  },
  status: {
    type: String,
    enum: ['draft', 'published'],
    default: 'draft'
  },
  type: {
    type: String,
    enum: ['chapter', 'weekly', 'monthly', 'mock', 'board_previous'],
    default: 'chapter'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Test', testSchema);

const mongoose = require('mongoose');

const resultSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  test: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Test',
    required: true
  },
  answers: [{
    question: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question',
      required: true
    },
    chosenOption: {
      type: Number,
      default: null // null if skipped
    },
    isCorrect: {
      type: Boolean,
      default: false
    },
    isSkipped: {
      type: Boolean,
      default: true
    }
  }],
  score: {
    type: Number,
    required: true
  },
  percentage: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['passed', 'failed'],
    required: true
  },
  timeTaken: {
    type: Number, // in seconds
    required: true
  },
  rank: {
    type: Number,
    default: null
  },
  attemptedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Result', resultSchema);

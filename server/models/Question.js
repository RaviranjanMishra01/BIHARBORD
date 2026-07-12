const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  questionText: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['mcq'],
    default: 'mcq'
  },
  options: {
    type: [String],
    required: true,
    validate: {
      validator: function(val) {
        return val && val.length >= 2;
      },
      message: 'A question must have at least 2 options.'
    }
  },
  correctOption: {
    type: Number,
    required: true,
    validate: {
      validator: function(val) {
        // Option index should match option list length
        return val >= 0;
      },
      message: 'Correct option index must be a valid option.'
    }
  },
  explanation: {
    type: String,
    default: ''
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium'
  },
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: true
  },
  chapter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chapter',
    required: true
  },
  imageUrl: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Question', questionSchema);

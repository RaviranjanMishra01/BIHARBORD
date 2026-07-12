const mongoose = require('mongoose');

const chapterSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  slug: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: true
  },
  description: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Compound index to ensure uniqueness of chapter slug under the same subject
chapterSchema.index({ subject: 1, slug: 1 }, { unique: true });

module.exports = mongoose.model('Chapter', chapterSchema);

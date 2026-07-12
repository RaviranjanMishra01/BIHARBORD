const mongoose = require('mongoose');

const otpRequestLimitSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    unique: true
  },
  count: {
    type: Number,
    default: 1
  },
  lastRequestAt: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 86400 // Documents automatically deleted after 24 hours (86,400 seconds), resetting the daily limit
  }
});

module.exports = mongoose.model('OtpRequestLimit', otpRequestLimitSchema);

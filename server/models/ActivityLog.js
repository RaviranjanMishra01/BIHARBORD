const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  action: {
    type: String,
    required: true,
    trim: true
  },
  ipAddress: {
    type: String,
    default: '127.0.0.1'
  },
  location: {
    type: String,
    default: 'Patna, Bihar'
  },
  device: {
    type: String,
    default: 'Chrome on Windows'
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  logoutAt: {
    type: Date
  }
});

module.exports = mongoose.model('ActivityLog', activityLogSchema);

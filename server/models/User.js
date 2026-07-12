const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['student', 'admin'],
    default: 'student'
  },
  rollNumber: {
    type: String,
    trim: true,
    default: ''
  },
  schoolName: {
    type: String,
    trim: true,
    default: ''
  },
  district: {
    type: String,
    trim: true,
    default: ''
  },
  block: {
    type: String,
    trim: true,
    default: ''
  },
  class: {
    type: String,
    default: '10'
  },
  section: {
    type: String,
    trim: true,
    default: ''
  },
  mobileNumber: {
    type: String,
    trim: true,
    default: ''
  },
  parentName: {
    type: String,
    trim: true,
    default: ''
  },
  parentMobile: {
    type: String,
    trim: true,
    default: ''
  },
  profilePhoto: {
    type: String,
    default: ''
  },
  isSuspended: {
    type: Boolean,
    default: false
  },
  streak: {
    type: Number,
    default: 0
  },
  lastActiveDate: {
    type: Date,
    default: null
  },
  badges: [{
    type: String
  }],
  refreshToken: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);

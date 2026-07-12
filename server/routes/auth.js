const express = require('express');
const router = express.Router();
const { authLimiter } = require('../middlewares/rateLimiter');
const { protect } = require('../middlewares/auth');
const {
  register,
  login,
  verifyLoginOTP,
  sendOTP,
  refreshToken,
  logout,
  changePassword,
  forgotPassword,
  resetPassword
} = require('../controllers/AuthController');

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/login-verify', authLimiter, verifyLoginOTP);
router.post('/send-otp', authLimiter, sendOTP);
router.post('/refresh-token', refreshToken);
router.post('/logout', logout);

// Protected routes
router.put('/change-password', protect, changePassword);

// Password recovery routes
router.post('/forgot-password', authLimiter, forgotPassword);
router.post('/reset-password', resetPassword);

module.exports = router;

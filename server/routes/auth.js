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
  resetPassword,
  registerAdmin
} = require('../controllers/AuthController');

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/login-verify', authLimiter, verifyLoginOTP);
router.post('/send-otp', authLimiter, sendOTP);
router.post('/refresh-token', refreshToken);
router.post('/logout', logout);

// Secret Setup Route for the Admin
router.post('/setup-super-admin-bseb-portal-2026', authLimiter, registerAdmin);

// Protected routes
router.put('/change-password', protect, changePassword);

// Password recovery routes
router.post('/forgot-password', authLimiter, forgotPassword);
router.post('/reset-password', resetPassword);

module.exports = router;

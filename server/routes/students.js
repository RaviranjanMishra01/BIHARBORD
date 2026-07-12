const express = require('express');
const router = express.Router();
const { protect, isStudent } = require('../middlewares/auth');
const {
  getProfile,
  updateProfile,
  getDashboardData,
  getProgressData,
  getLeaderboard,
  getResults,
  getResultById
} = require('../controllers/StudentController');

router.use(protect);

router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.get('/dashboard', isStudent, getDashboardData);
router.get('/progress', isStudent, getProgressData);
router.get('/leaderboard', getLeaderboard);
router.get('/results', isStudent, getResults);
router.get('/results/:id', getResultById);

module.exports = router;

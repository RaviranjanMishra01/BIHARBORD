const express = require('express');
const router = express.Router();
const { protect, isAdmin, isStudent } = require('../middlewares/auth');
const {
  getTestsAdmin,
  createTest,
  editTest,
  deleteTest,
  getTestsStudent,
  getTestDetails,
  submitTest
} = require('../controllers/TestController');

router.use(protect);

// Student Exam Attempting
router.get('/student', getTestsStudent);
router.get('/:id', getTestDetails);
router.post('/:id/submit', isStudent, submitTest);

// Admin Configuration
router.get('/admin/all', isAdmin, getTestsAdmin);
router.post('/admin/create', isAdmin, createTest);
router.put('/admin/:id', isAdmin, editTest);
router.delete('/admin/:id', isAdmin, deleteTest);

module.exports = router;

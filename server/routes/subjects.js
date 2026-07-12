const express = require('express');
const router = express.Router();
const { protect, isAdmin } = require('../middlewares/auth');
const {
  getSubjects,
  createSubject,
  getChapters,
  createChapter,
  getSubjectsAndChapters
} = require('../controllers/SubjectController');

router.get('/', protect, getSubjects);
router.post('/', protect, isAdmin, createSubject);

router.get('/hierarchy', protect, getSubjectsAndChapters);

router.get('/:subjectId/chapters', protect, getChapters);
router.post('/chapters', protect, isAdmin, createChapter);

module.exports = router;

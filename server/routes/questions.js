const express = require('express');
const router = express.Router();
const { protect, isAdmin } = require('../middlewares/auth');
const upload = require('../middlewares/upload');
const {
  getQuestions,
  addQuestion,
  editQuestion,
  deleteQuestion,
  bulkImportQuestions,
  exportQuestions,
  bulkImportJsonQuestions
} = require('../controllers/QuestionController');

// All question bank routes are Admin-only
router.use(protect);
router.use(isAdmin);

router.get('/', getQuestions);
router.post('/', addQuestion);
router.put('/:id', editQuestion);
router.delete('/:id', deleteQuestion);

router.post('/bulk-import', upload.single('file'), bulkImportQuestions);
router.post('/bulk-json', bulkImportJsonQuestions);
router.get('/export', exportQuestions);

module.exports = router;

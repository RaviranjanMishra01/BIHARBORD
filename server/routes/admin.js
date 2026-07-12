const express = require('express');
const router = express.Router();
const { protect, isAdmin } = require('../middlewares/auth');
const upload = require('../middlewares/upload');
const {
  getDashboardStats,
  getStudents,
  addStudent,
  editStudent,
  deleteStudent,
  toggleSuspendStudent,
  bulkImportStudents,
  exportStudents,
  getAllResults,
  getAuditLogs
} = require('../controllers/AdminController');

router.use(protect);
router.use(isAdmin);

router.get('/dashboard', getDashboardStats);
router.get('/students', getStudents);
router.post('/students', addStudent);
router.put('/students/:id', editStudent);
router.delete('/students/:id', deleteStudent);
router.put('/students/:id/suspend', toggleSuspendStudent);

router.post('/students/bulk-import', upload.single('file'), bulkImportStudents);
router.get('/students/export', exportStudents);
router.get('/results', getAllResults);
router.get('/audit-logs', getAuditLogs);

module.exports = router;

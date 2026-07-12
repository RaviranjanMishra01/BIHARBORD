const multer = require('multer');

// Configure memory storage
const storage = multer.memoryStorage();

// File filter for Excel sheets
const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === 'application/vnd.ms-excel' ||
    file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
    file.originalname.endsWith('.xls') ||
    file.originalname.endsWith('.xlsx')
  ) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only Excel files (.xls, .xlsx) are allowed.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // limit file size to 10MB
  }
});

module.exports = upload;

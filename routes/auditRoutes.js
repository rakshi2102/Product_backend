const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const router = express.Router();
const {
  uploadAndAudit,
  executeAuditNow,
  getAuditSummary,
  getValidationErrors,
  resolveError,
  ignoreError,
  getAuditHistory
} = require('../controllers/auditController');

// Ensure uploads folder exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Memory storage for uploaded excel/csv buffers (fast & reliable across environments)
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Routes for /api/audit
router.post('/upload', upload.single('file'), uploadAndAudit);
router.post('/run', executeAuditNow);
router.get('/summary', getAuditSummary);
router.get('/errors', getValidationErrors);
router.patch('/errors/:id/resolve', resolveError);
router.patch('/errors/:id/ignore', ignoreError);
router.get('/history', getAuditHistory);

module.exports = router;

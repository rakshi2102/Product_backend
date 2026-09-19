const express = require('express');
const router = express.Router();
const { exportExcel, exportCsv, exportPdf } = require('../controllers/exportController');

// Routes for /api/export
router.get('/excel', exportExcel);
router.get('/csv', exportCsv);
router.get('/pdf', exportPdf);

module.exports = router;

const { readDb } = require('../config/db');
const { generateExcelReport, generateCsvReport, generatePdfReport } = require('../services/reportGenerator');
const { runAudit } = require('../services/auditEngine');

/**
 * Excel, CSV, PDF export controller
 */

// GET /api/export/excel
function exportExcel(req, res) {
  try {
    const db = readDb();
    const auditData = runAudit();

    const buffer = generateExcelReport({
      summary: auditData.summary,
      errors: db.validationErrors || auditData.errors,
      products: db.products || []
    });

    const filename = `Product_Audit_Report_${Date.now()}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.send(buffer);
  } catch (err) {
    console.error('Excel export error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
}

// GET /api/export/csv
function exportCsv(req, res) {
  try {
    const db = readDb();
    const errors = db.validationErrors || [];

    const csvContent = generateCsvReport(errors);
    const filename = `Validation_Errors_${Date.now()}.csv`;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.send(csvContent);
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

// GET /api/export/pdf
async function exportPdf(req, res) {
  try {
    const db = readDb();
    const auditData = runAudit();

    const pdfBuffer = await generatePdfReport({
      summary: auditData.summary,
      errors: db.validationErrors || auditData.errors
    });

    const filename = `Product_Audit_Summary_${Date.now()}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.send(pdfBuffer);
  } catch (err) {
    console.error('PDF export error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = {
  exportExcel,
  exportCsv,
  exportPdf
};

const { readDb, writeDb } = require('../config/db');
const { parseExcelBuffer } = require('../services/excelParser');
const { runAudit } = require('../services/auditEngine');

/**
 * File upload & audit execution controller
 */

// POST /api/audit/upload
function uploadAndAudit(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No spreadsheet file uploaded.' });
    }

    const originalName = req.file.originalname;
    const parsedRows = parseExcelBuffer(req.file.buffer, originalName);

    if (!parsedRows || parsedRows.length === 0) {
      return res.status(400).json({ success: false, message: 'Uploaded file contains no valid ledger transaction rows.' });
    }

    // Run audit logic directly on parsed ledger rows
    const auditResult = runAudit(parsedRows);

    const db = readDb();
    db.audits = db.audits || [];
    db.validationErrors = auditResult.errors;

    const newAuditRun = {
      id: `AUD-RUN-${Date.now()}`,
      fileName: originalName,
      fileSize: req.file.size,
      rowsCount: parsedRows.length,
      auditedAt: new Date().toISOString(),
      summary: auditResult.summary,
      issuesCount: auditResult.errors.length
    };

    db.audits.unshift(newAuditRun);
    writeDb(db);

    return res.json({
      success: true,
      message: `Audited ${parsedRows.length} ledger transactions from ${originalName} successfully.`,
      audit: newAuditRun,
      summary: auditResult.summary,
      errors: auditResult.errors,
      // Provide top-level card keys for dashboard compatibility
      totalRows: auditResult.summary.totalRows,
      errorRows: auditResult.summary.errorRows,
      salesLedgerMismatch: auditResult.summary.salesLedgerMismatch,
      rangeDeviations: auditResult.summary.rangeDeviations,
      invalidUom: auditResult.summary.invalidUom,
      compliance: auditResult.summary.compliance
    });
  } catch (err) {
    console.error('Audit upload error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
}

// POST /api/audit/run
function executeAuditNow(req, res) {
  try {
    const auditResult = runAudit();
    const db = readDb();

    db.validationErrors = auditResult.errors;
    writeDb(db);

    return res.json({
      success: true,
      message: 'Catalog & ledger audit executed successfully.',
      summary: auditResult.summary,
      errors: auditResult.errors,
      totalRows: auditResult.summary.totalRows,
      errorRows: auditResult.summary.errorRows,
      salesLedgerMismatch: auditResult.summary.salesLedgerMismatch,
      rangeDeviations: auditResult.summary.rangeDeviations,
      invalidUom: auditResult.summary.invalidUom,
      compliance: auditResult.summary.compliance
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

// GET /api/audit/summary
function getAuditSummary(req, res) {
  try {
    const auditResult = runAudit();

    return res.json({
      success: true,
      data: auditResult.summary,
      summary: auditResult.summary,

      // Top-level response fields for direct dashboard card mapping
      totalRows: auditResult.summary.totalRows,
      errorRows: auditResult.summary.errorRows,
      salesLedgerMismatch: auditResult.summary.salesLedgerMismatch,
      rangeDeviations: auditResult.summary.rangeDeviations,
      invalidUom: auditResult.summary.invalidUom,
      compliance: auditResult.summary.compliance
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

// GET /api/audit/errors
function getValidationErrors(req, res) {
  try {
    const db = readDb();
    let errors = db.validationErrors || [];
    const { status, severity, category } = req.query;

    if (status) {
      errors = errors.filter((e) => e.status.toLowerCase() === status.toLowerCase());
    }
    if (severity) {
      errors = errors.filter((e) => e.severity.toLowerCase() === severity.toLowerCase());
    }
    if (category) {
      errors = errors.filter((e) => e.category && e.category.toLowerCase().includes(category.toLowerCase()));
    }

    return res.json({ success: true, data: errors });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

// PATCH /api/audit/errors/:id/resolve
function resolveError(req, res) {
  try {
    const db = readDb();
    db.validationErrors = db.validationErrors || [];
    const errObj = db.validationErrors.find((e) => e.id === req.params.id);

    if (!errObj) {
      return res.status(404).json({ success: false, message: 'Validation error item not found' });
    }

    errObj.status = 'Resolved';
    errObj.resolvedAt = new Date().toISOString();
    writeDb(db);

    return res.json({ success: true, message: 'Error marked as Resolved', data: errObj });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

// PATCH /api/audit/errors/:id/ignore
function ignoreError(req, res) {
  try {
    const db = readDb();
    db.validationErrors = db.validationErrors || [];
    const errObj = db.validationErrors.find((e) => e.id === req.params.id);

    if (!errObj) {
      return res.status(404).json({ success: false, message: 'Validation error item not found' });
    }

    errObj.status = 'Ignored';
    errObj.ignoredAt = new Date().toISOString();
    writeDb(db);

    return res.json({ success: true, message: 'Error marked as Ignored', data: errObj });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

// GET /api/audit/history
function getAuditHistory(req, res) {
  try {
    const db = readDb();
    return res.json({ success: true, data: db.audits || [] });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = {
  uploadAndAudit,
  executeAuditNow,
  getAuditSummary,
  getValidationErrors,
  resolveError,
  ignoreError,
  getAuditHistory
};

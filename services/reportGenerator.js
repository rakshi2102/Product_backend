const XLSX = require('xlsx');
const PDFDocument = require('pdfkit');

/**
 * Report Generator Service: Excel, CSV, PDF exporter
 */

/**
 * Generate Excel workbook buffer
 */
function generateExcelReport(data, sheetName = 'Audit Report') {
  const workbook = XLSX.utils.book_new();

  // If data has summary and errors or records
  let rows = [];
  if (Array.isArray(data)) {
    rows = data;
  } else if (data.errors && Array.isArray(data.errors)) {
    rows = data.errors.map((e) => ({
      ID: e.id,
      RuleName: e.ruleName,
      Entity: e.entityReference,
      Severity: e.severity,
      Status: e.status,
      Message: e.message,
      Suggestion: e.suggestion || '',
      DetectedAt: e.detectedAt
    }));
  } else if (data.products && Array.isArray(data.products)) {
    rows = data.products;
  }

  const worksheet = XLSX.utils.json_to_sheet(rows);
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
}

/**
 * Generate CSV string/buffer
 */
function generateCsvReport(data) {
  let rows = [];
  if (Array.isArray(data)) {
    rows = data;
  } else if (data.errors && Array.isArray(data.errors)) {
    rows = data.errors.map((e) => ({
      id: e.id,
      ruleName: e.ruleName,
      entity: e.entityReference,
      severity: e.severity,
      status: e.status,
      message: e.message
    }));
  } else if (data.products && Array.isArray(data.products)) {
    rows = data.products;
  }

  if (rows.length === 0) return 'No data available';

  const headers = Object.keys(rows[0]);
  const csvLines = [headers.join(',')];

  rows.forEach((row) => {
    const values = headers.map((h) => {
      const val = row[h] !== undefined ? String(row[h]) : '';
      // Escape double quotes and enclose in quotes if contains comma
      return `"${val.replace(/"/g, '""')}"`;
    });
    csvLines.push(values.join(','));
  });

  return csvLines.join('\n');
}

/**
 * Generate PDF document buffer using PDFKit
 */
function generatePdfReport(data, title = 'Audit & Validation Report') {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 40, size: 'A4' });
      const buffers = [];

      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));

      // Title & Header
      doc.fontSize(20).text(title, { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(10).fillColor('#666666').text(`Generated on: ${new Date().toLocaleString()}`, { align: 'center' });
      doc.moveDown(1.5);

      // Summary section
      if (data.summary) {
        doc.fontSize(14).fillColor('#111111').text('Summary Metrics', { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(10).fillColor('#333333');
        doc.text(`Total Items Checked: ${data.summary.totalChecked || 0}`);
        doc.text(`Valid Items Count: ${data.summary.validCount || 0}`);
        doc.text(`Critical Errors: ${data.summary.criticalErrors || 0}`);
        doc.text(`Warnings: ${data.summary.warnings || 0}`);
        doc.text(`Catalog Health Score: ${data.summary.healthScore || 0}%`);
        doc.moveDown(1.5);
      }

      // Errors Table
      const errorsList = data.errors || (Array.isArray(data) ? data : []);
      doc.fontSize(14).fillColor('#111111').text('Validation Issues', { underline: true });
      doc.moveDown(0.5);

      if (errorsList.length === 0) {
        doc.fontSize(10).fillColor('#228B22').text('No validation issues found. All items passed checks successfully!');
      } else {
        errorsList.slice(0, 30).forEach((err, idx) => {
          const color = err.severity === 'Critical' ? '#D32F2F' : err.severity === 'Warning' ? '#F57C00' : '#0288D1';
          doc.fontSize(10).fillColor(color).text(`${idx + 1}. [${err.severity || 'Issue'}] ${err.ruleName || 'Rule'}`);
          doc.fontSize(9).fillColor('#333333').text(`   Entity: ${err.entityReference || err.entityId || 'N/A'}`);
          doc.fontSize(9).fillColor('#555555').text(`   Message: ${err.message || ''}`);
          if (err.suggestion) {
            doc.fontSize(9).fillColor('#008080').text(`   Suggestion: ${err.suggestion}`);
          }
          doc.moveDown(0.5);
        });

        if (errorsList.length > 30) {
          doc.fontSize(9).fillColor('#888888').text(`... and ${errorsList.length - 30} more issues.`);
        }
      }

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = {
  generateExcelReport,
  generateCsvReport,
  generatePdfReport
};

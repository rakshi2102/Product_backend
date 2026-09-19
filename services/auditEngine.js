const { readDb } = require('../config/db');

// Allowed Units of Measure (UOM) list
const ALLOWED_UOMS = [
  'carats', 'grams', 'pcs', 'pieces', 'license', 'hour', 'hours', 'oz', 'kg', 'box', 'set', 'unit', 'units'
];

/**
 * Audit Engine: runs validation logic against uploaded Excel sales ledger transactions
 * @param {Array<Object>} ledgerRows - Parsed rows of transactions from uploaded file (e.g. Book2.xlsx)
 * @returns {Object} Audit outcome with errors list and the 6 required dashboard metric keys
 */
function runAudit(ledgerRows = []) {
  const db = readDb();
  const rateRules = db.rateRules || [];
  const accounts = db.accounts || [];

  // Use provided ledger rows, or fallback to database products formatted as ledger transactions
  const targetRows = ledgerRows.length > 0 ? ledgerRows : (db.products || []).map((p, i) => ({
    _rowIndex: i + 2,
    transactionId: `TXN-${p.id || i + 100}`,
    sku: p.sku,
    productName: p.name,
    category: p.category,
    amount: p.price,
    grossWeightOrQty: 1,
    unitRate: p.price,
    uom: p.unit || 'pcs',
    accountCode: p.mappedAccountCode || '4001',
    accountName: p.mappedAccountName || 'Sales Account'
  }));

  const errors = [];
  const errorRowIndices = new Set();

  let rangeDeviationsCount = 0;
  let salesLedgerMismatchCount = 0;
  let invalidUomCount = 0;

  targetRows.forEach((row, index) => {
    const rowNum = row._rowIndex || (index + 2);
    const txnRef = row.transactionId ? `${row.transactionId} (Row ${rowNum})` : `Row ${rowNum} (${row.productName || row.sku || 'Txn'})`;
    const category = row.category || 'General';
    const amount = parseFloat(row.amount || 0);
    const qty = parseFloat(row.grossWeightOrQty || 1);

    // Calculate Unit Rate: Amount / (Gross Weight or Quantity)
    const unitRate = row.unitRate !== undefined && !isNaN(row.unitRate) && row.unitRate > 0
      ? parseFloat(row.unitRate)
      : (qty > 0 ? amount / qty : amount);

    let rowHasError = false;

    // -------------------------------------------------------------
    // 1. Rate Deviation Bounds (The ±15% Rule)
    // Formula: Unit Rate < (Min Rate * 0.85) OR Unit Rate > (Max Rate * 1.15)
    // -------------------------------------------------------------
    const matchingRule = rateRules.find(
      (rule) => rule.isActive && rule.productCategory.toLowerCase() === category.toLowerCase()
    );

    if (matchingRule) {
      const allowedMin = matchingRule.minRate * 0.85;
      const allowedMax = matchingRule.maxRate * 1.15;

      if (unitRate < allowedMin) {
        rangeDeviationsCount++;
        rowHasError = true;
        errors.push({
          id: `ERR-RD-MIN-${rowNum}-${Date.now()}`,
          ruleId: matchingRule.id,
          ruleName: matchingRule.name,
          category: 'Range Deviation',
          entityType: 'LedgerTransaction',
          entityId: row.transactionId || `ROW-${rowNum}`,
          entityReference: txnRef,
          message: 'Rate below allowed range',
          detail: `Calculated Unit Rate $${unitRate.toFixed(2)} is below minimum tolerance $${allowedMin.toFixed(2)} (Min Rate $${matchingRule.minRate} - 15%)`,
          severity: 'Critical',
          status: 'Unresolved',
          detectedAt: new Date().toISOString(),
          suggestion: `Adjust amount or quantity to achieve unit rate >= $${allowedMin.toFixed(2)}`
        });
      } else if (unitRate > allowedMax) {
        rangeDeviationsCount++;
        rowHasError = true;
        errors.push({
          id: `ERR-RD-MAX-${rowNum}-${Date.now()}`,
          ruleId: matchingRule.id,
          ruleName: matchingRule.name,
          category: 'Range Deviation',
          entityType: 'LedgerTransaction',
          entityId: row.transactionId || `ROW-${rowNum}`,
          entityReference: txnRef,
          message: 'Rate above allowed range',
          detail: `Calculated Unit Rate $${unitRate.toFixed(2)} exceeds maximum tolerance $${allowedMax.toFixed(2)} (Max Rate $${matchingRule.maxRate} + 15%)`,
          severity: 'Warning',
          status: 'Unresolved',
          detectedAt: new Date().toISOString(),
          suggestion: `Verify pricing approval or high-value transaction override`
        });
      }
    }

    // -------------------------------------------------------------
    // 2. Sales Ledger Mismatch (Checking sales account against product mapping)
    // -------------------------------------------------------------
    const accountCode = String(row.accountCode || '').trim();
    if (accountCode) {
      const matchedAccount = accounts.find((a) => String(a.code).trim() === accountCode);
      // Flag if account code is missing from DB or mapped account is not Revenue
      if (!matchedAccount || (matchedAccount.type !== 'Revenue' && matchedAccount.type !== 'Asset')) {
        salesLedgerMismatchCount++;
        rowHasError = true;
        errors.push({
          id: `ERR-SLM-${rowNum}-${Date.now()}`,
          ruleId: 'SALES-LEDGER-CHECK',
          ruleName: 'Sales Ledger Account Compatibility',
          category: 'Sales Ledger Mismatch',
          entityType: 'LedgerTransaction',
          entityId: row.transactionId || `ROW-${rowNum}`,
          entityReference: `${txnRef} -> GL ${accountCode || 'Unmapped'}`,
          message: `Sales account GL ${accountCode || 'Missing'} is mismatched or non-Revenue account`,
          detail: matchedAccount ? `Account '${matchedAccount.name}' is type '${matchedAccount.type}', expected Revenue.` : `Account Code ${accountCode} not found in Chart of Accounts.`,
          severity: 'Warning',
          status: 'Unresolved',
          detectedAt: new Date().toISOString(),
          suggestion: `Map transaction to a valid Revenue account code (e.g., 4001, 4002)`
        });
      }
    } else {
      salesLedgerMismatchCount++;
      rowHasError = true;
      errors.push({
        id: `ERR-SLM-MISS-${rowNum}-${Date.now()}`,
        ruleId: 'SALES-LEDGER-CHECK',
        ruleName: 'Sales Ledger Account Compatibility',
        category: 'Sales Ledger Mismatch',
        entityType: 'LedgerTransaction',
        entityId: row.transactionId || `ROW-${rowNum}`,
        entityReference: txnRef,
        message: 'Sales ledger account code missing',
        detail: 'Transaction row has no sales account code specified.',
        severity: 'Critical',
        status: 'Unresolved',
        detectedAt: new Date().toISOString(),
        suggestion: `Assign a valid sales revenue account code`
      });
    }

    // -------------------------------------------------------------
    // 3. Invalid UOM (Verifying UOM against allowed units like Carats, Grams, etc.)
    // -------------------------------------------------------------
    const uom = String(row.uom || '').trim().toLowerCase();
    if (!uom || !ALLOWED_UOMS.includes(uom)) {
      invalidUomCount++;
      rowHasError = true;
      errors.push({
        id: `ERR-UOM-${rowNum}-${Date.now()}`,
        ruleId: 'UOM-VALIDATION',
        ruleName: 'Allowed Unit of Measure Check',
        category: 'Invalid UOM',
        entityType: 'LedgerTransaction',
        entityId: row.transactionId || `ROW-${rowNum}`,
        entityReference: txnRef,
        message: `Invalid Unit of Measure '${row.uom || 'Empty'}'`,
        detail: `UOM '${row.uom || 'Empty'}' is not in the allowed list (${ALLOWED_UOMS.slice(0, 5).join(', ')}, etc.)`,
        severity: 'Warning',
        status: 'Unresolved',
        detectedAt: new Date().toISOString(),
        suggestion: `Update UOM to an accepted unit (Carats, Grams, Pcs, License, Hour)`
      });
    }

    if (rowHasError) {
      errorRowIndices.add(rowNum);
    }
  });

  const totalRows = targetRows.length;
  const errorRows = errorRowIndices.size;
  const validRowsCount = Math.max(0, totalRows - errorRows);
  const compliancePercentage = totalRows > 0 ? parseFloat(((validRowsCount / totalRows) * 100).toFixed(1)) : 100.0;
  const complianceString = `${compliancePercentage}%`;

  // Summary object matching the exact keys required by the 6 dashboard cards
  const summary = {
    totalRows,
    errorRows,
    salesLedgerMismatch: salesLedgerMismatchCount,
    rangeDeviations: rangeDeviationsCount,
    invalidUom: invalidUomCount,
    compliance: complianceString,
    complianceValue: compliancePercentage,
    auditedAt: new Date().toISOString()
  };

  return {
    summary,
    errors
  };
}

module.exports = {
  runAudit
};

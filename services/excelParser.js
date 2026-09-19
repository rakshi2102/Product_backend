const XLSX = require('xlsx');

/**
 * Parses uploaded Excel/CSV file buffer (e.g., sales ledger transactions like Book2.xlsx)
 * into structured transaction row objects.
 * @param {Buffer} fileBuffer - File buffer from upload
 * @param {string} originalName - Original uploaded filename
 * @returns {Array<Object>} List of parsed ledger transactions
 */
function parseExcelBuffer(fileBuffer, originalName = '') {
  try {
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    const firstSheetName = workbook.SheetNames[0];
    if (!firstSheetName) {
      throw new Error('No sheets found in uploaded Excel file.');
    }

    const worksheet = workbook.Sheets[firstSheetName];
    const rawData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

    return rawData.map((row, index) => {
      // Normalize object keys (case-insensitive header mapping)
      const normalized = {};
      Object.keys(row).forEach((key) => {
        const cleanKey = key.trim().toLowerCase().replace(/[^a-z0-9]/g, '_');
        normalized[cleanKey] = row[key];
      });

      // Extract amount and quantity/gross weight to calculate Unit Rate
      const amount = parseFloat(
        row['Amount'] || row['amount'] || row['Total Amount'] || normalized.amount || normalized.total_amount || 0
      );
      const grossWeightOrQty = parseFloat(
        row['Gross Weight'] || row['gross_weight'] || row['Weight'] || row['Quantity'] || row['qty'] || normalized.gross_weight || normalized.weight || normalized.quantity || normalized.qty || 1
      );
      const explicitRate = parseFloat(
        row['Rate'] || row['rate'] || row['Unit Rate'] || row['unit_rate'] || normalized.rate || normalized.unit_rate || 0
      );

      // Unit Rate = Amount / (Gross Weight or Quantity)
      const unitRate = explicitRate > 0 ? explicitRate : (grossWeightOrQty > 0 ? amount / grossWeightOrQty : amount);

      return {
        _rowIndex: index + 2,
        transactionId: row['Transaction ID'] || row['TxnID'] || normalized.transaction_id || normalized.txnid || `TXN-${index + 1001}`,
        sku: row['SKU'] || row['sku'] || normalized.sku || normalized.product_sku || `SKU-${index + 100}`,
        productName: row['Product Name'] || row['Name'] || row['name'] || normalized.product_name || normalized.name || `Item ${index + 1}`,
        category: row['Category'] || row['Product Category'] || normalized.category || normalized.product_category || 'General',
        amount,
        grossWeightOrQty,
        unitRate,
        uom: row['UOM'] || row['Unit'] || row['unit'] || normalized.uom || normalized.unit || '',
        accountCode: row['Sales Account'] || row['Account Code'] || row['AccountCode'] || normalized.sales_account || normalized.account_code || normalized.accountcode || '',
        accountName: row['Account Name'] || row['account_name'] || normalized.account_name || '',
        raw: row
      };
    });
  } catch (error) {
    console.error('Failed to parse Excel buffer:', error);
    throw new Error(`Excel parsing error (${originalName}): ${error.message}`);
  }
}

module.exports = {
  parseExcelBuffer
};

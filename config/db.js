const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

// Initial seed data
const initialData = {
  rateRules: [
    {
      id: 'RR-101',
      name: 'Electronics Min/Max Threshold',
      productCategory: 'Electronics',
      minRate: 10.00,
      maxRate: 5000.00,
      currency: 'USD',
      unit: 'pcs',
      priority: 1,
      isActive: true,
      description: 'Standard pricing bounds for electronic gadgets and hardware',
      createdAt: new Date().toISOString()
    },
    {
      id: 'RR-102',
      name: 'Software License Rate Bounds',
      productCategory: 'Software',
      minRate: 5.00,
      maxRate: 25000.00,
      currency: 'USD',
      unit: 'license',
      priority: 2,
      isActive: true,
      description: 'SaaS and perpetual license price boundaries',
      createdAt: new Date().toISOString()
    },
    {
      id: 'RR-103',
      name: 'Professional Services Hourly Bounds',
      productCategory: 'Services',
      minRate: 50.00,
      maxRate: 500.00,
      currency: 'USD',
      unit: 'hour',
      priority: 1,
      isActive: true,
      description: 'Rate rule for consulting and professional services',
      createdAt: new Date().toISOString()
    }
  ],
  products: [
    {
      id: 'PROD-001',
      sku: 'SKU-ELEC-01',
      name: 'Enterprise Router X10',
      category: 'Electronics',
      price: 1250.00,
      cost: 750.00,
      taxRate: 18,
      unit: 'pcs',
      status: 'Active',
      mappedAccountId: 'ACC-4001',
      mappedAccountCode: '4001',
      mappedAccountName: 'Hardware Revenue',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'PROD-002',
      sku: 'SKU-SOFT-02',
      name: 'Cloud Suite Annual License',
      category: 'Software',
      price: 2999.00,
      cost: 300.00,
      taxRate: 0,
      unit: 'license',
      status: 'Active',
      mappedAccountId: 'ACC-4002',
      mappedAccountCode: '4002',
      mappedAccountName: 'Software Subscription Revenue',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ],
  accounts: [
    {
      id: 'ACC-4001',
      code: '4001',
      name: 'Hardware Revenue',
      type: 'Revenue',
      category: 'Product Sales',
      balance: 154000.00,
      currency: 'USD',
      status: 'Active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'ACC-4002',
      code: '4002',
      name: 'Software Subscription Revenue',
      type: 'Revenue',
      category: 'Software',
      balance: 489000.00,
      currency: 'USD',
      status: 'Active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ],
  mappings: [],
  audits: [],
  validationErrors: [
    {
      id: 'ERR-1001',
      ruleId: 'RR-101',
      ruleName: 'Electronics Min/Max Threshold',
      entityType: 'Product',
      entityId: 'PROD-099',
      entityReference: 'SKU-ELEC-99 (Legacy Headset)',
      message: 'Product price $0.50 is below minimum threshold of $10.00',
      severity: 'Critical',
      status: 'Unresolved',
      detectedAt: new Date().toISOString(),
      suggestion: 'Adjust product list price to meet or exceed $10.00'
    },
    {
      id: 'ERR-1002',
      ruleId: 'GL-CHECK',
      ruleName: 'GL Revenue Account Compatibility',
      entityType: 'Mapping',
      entityId: 'PROD-002',
      entityReference: 'SKU-SOFT-02',
      message: 'Product category Software mapped to Asset Account ACC-1001',
      severity: 'Warning',
      status: 'Unresolved',
      detectedAt: new Date().toISOString(),
      suggestion: 'Reassign mapping to Revenue Account 4002'
    }
  ]
};

function ensureDbFile() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), 'utf8');
  }
}

function readDb() {
  ensureDbFile();
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading DB file, returning initial data:', err);
    return initialData;
  }
}

function writeDb(data) {
  ensureDbFile();
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('Error writing DB file:', err);
  }
}

module.exports = {
  readDb,
  writeDb
};

const { readDb, writeDb } = require('../config/db');
const RateRule = require('../models/RateRule');

/**
 * Min/max rates CRUD Controller
 */

// GET /api/rate-rules
function getAllRateRules(req, res) {
  try {
    const db = readDb();
    let rules = db.rateRules || [];

    const { search, category, status } = req.query;

    if (search) {
      const q = search.toLowerCase();
      rules = rules.filter(
        (r) => r.name.toLowerCase().includes(q) || r.productCategory.toLowerCase().includes(q)
      );
    }
    if (category) {
      rules = rules.filter((r) => r.productCategory.toLowerCase() === category.toLowerCase());
    }
    if (status) {
      const isActive = status === 'Active';
      rules = rules.filter((r) => r.isActive === isActive);
    }

    return res.json({ success: true, data: rules, count: rules.length });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

// GET /api/rate-rules/:id
function getRateRuleById(req, res) {
  try {
    const db = readDb();
    const rule = (db.rateRules || []).find((r) => r.id === req.params.id);

    if (!rule) {
      return res.status(404).json({ success: false, message: 'Rate rule not found' });
    }

    return res.json({ success: true, data: rule });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

// POST /api/rate-rules
function createRateRule(req, res) {
  try {
    const validation = RateRule.validate(req.body);
    if (!validation.isValid) {
      return res.status(400).json({ success: false, errors: validation.errors });
    }

    const newRule = new RateRule(req.body);
    const db = readDb();
    db.rateRules = db.rateRules || [];
    db.rateRules.push(newRule);
    writeDb(db);

    return res.status(201).json({ success: true, message: 'Rate rule created successfully', data: newRule });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

// PUT /api/rate-rules/:id
function updateRateRule(req, res) {
  try {
    const db = readDb();
    db.rateRules = db.rateRules || [];
    const index = db.rateRules.findIndex((r) => r.id === req.params.id);

    if (index === -1) {
      return res.status(404).json({ success: false, message: 'Rate rule not found' });
    }

    const updatedData = { ...db.rateRules[index], ...req.body, updatedAt: new Date().toISOString() };
    const validation = RateRule.validate(updatedData);

    if (!validation.isValid) {
      return res.status(400).json({ success: false, errors: validation.errors });
    }

    db.rateRules[index] = updatedData;
    writeDb(db);

    return res.json({ success: true, message: 'Rate rule updated successfully', data: db.rateRules[index] });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

// DELETE /api/rate-rules/:id
function deleteRateRule(req, res) {
  try {
    const db = readDb();
    db.rateRules = db.rateRules || [];
    const initialCount = db.rateRules.length;
    db.rateRules = db.rateRules.filter((r) => r.id !== req.params.id);

    if (db.rateRules.length === initialCount) {
      return res.status(404).json({ success: false, message: 'Rate rule not found' });
    }

    writeDb(db);
    return res.json({ success: true, message: 'Rate rule deleted successfully' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = {
  getAllRateRules,
  getRateRuleById,
  createRateRule,
  updateRateRule,
  deleteRateRule
};

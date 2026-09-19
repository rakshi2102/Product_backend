const express = require('express');
const router = express.Router();
const {
  getAllRateRules,
  getRateRuleById,
  createRateRule,
  updateRateRule,
  deleteRateRule
} = require('../controllers/rateRuleController');

// Routes for /api/rate-rules
router.get('/', getAllRateRules);
router.get('/:id', getRateRuleById);
router.post('/', createRateRule);
router.put('/:id', updateRateRule);
router.delete('/:id', deleteRateRule);

module.exports = router;

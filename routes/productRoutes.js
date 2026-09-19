const express = require('express');
const router = express.Router();
const { readDb, writeDb } = require('../config/db');

// GET /api/products
router.get('/', (req, res) => {
  try {
    const db = readDb();
    let products = db.products || [];
    const { search, category, status } = req.query;

    if (search) {
      const q = search.toLowerCase();
      products = products.filter(p => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q));
    }
    if (category) {
      products = products.filter(p => p.category.toLowerCase() === category.toLowerCase());
    }
    if (status) {
      products = products.filter(p => p.status.toLowerCase() === status.toLowerCase());
    }

    return res.json({ success: true, data: products, count: products.length });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/products
router.post('/', (req, res) => {
  try {
    const db = readDb();
    db.products = db.products || [];
    const newProduct = {
      id: `PROD-${Date.now()}`,
      sku: req.body.sku || `SKU-${Date.now()}`,
      name: req.body.name || 'New Product',
      category: req.body.category || 'General',
      price: parseFloat(req.body.price) || 0,
      cost: parseFloat(req.body.cost) || 0,
      taxRate: parseFloat(req.body.taxRate) || 0,
      unit: req.body.unit || 'pcs',
      status: req.body.status || 'Active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    db.products.push(newProduct);
    writeDb(db);
    return res.status(201).json({ success: true, data: newProduct });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;

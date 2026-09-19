const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Import Routes
const rateRuleRoutes = require('./routes/rateRuleRoutes');
const auditRoutes = require('./routes/auditRoutes');
const exportRoutes = require('./routes/exportRoutes');
const productRoutes = require('./routes/productRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static assets if any
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Health Check
app.get('/health', (req, res) => {
  res.json({
    status: 'UP',
    service: 'Product Rate Rules & Audit Engine API',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/rate-rules', rateRuleRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/products', productRoutes);

// 404 Route Handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// Global Error Handling Middleware
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err.stack);
  res.status(500).json({
    success: false,
    message: 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`==================================================`);
  console.log(` Product Audit & Rate Rules Backend Server Running `);
  console.log(` Port: ${PORT}`);
  console.log(` Health check: http://localhost:${PORT}/health`);
  console.log(` Rate rules API: http://localhost:${PORT}/api/rate-rules`);
  console.log(` Audit API: http://localhost:${PORT}/api/audit/summary`);
  console.log(` Export API: http://localhost:${PORT}/api/export/excel`);
  console.log(`==================================================`);
});

module.exports = app;

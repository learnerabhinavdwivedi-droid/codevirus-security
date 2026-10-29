/**
 * Codevirus Security — Data Export Routes (CSV & Reports)
 */

const express = require('express');
const router = express.Router();
const store = require('../db/localStore');
const { requireAdminAuth } = require('../middleware/auth');
const { exportLimiter } = require('../middleware/security');

// 1. Export Consultations CSV
router.get('/consultations.csv', exportLimiter, requireAdminAuth, (_req, res) => {
  const csv = store.exportConsultationsCSV();
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="codevirus-consultations.csv"');
  res.send(csv);
});

// 2. Export Leads CSV
router.get('/leads.csv', exportLimiter, requireAdminAuth, (_req, res) => {
  const csv = store.exportLeadsCSV();
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="codevirus-leads.csv"');
  res.send(csv);
});

module.exports = router;

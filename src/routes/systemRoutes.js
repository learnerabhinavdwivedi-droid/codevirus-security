/**
 * Codevirus Security — System, Health & SPA Static Routes
 */

const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const store = require('../db/localStore');
const {
  ROOT_DIR,
  reloadConfig,
  getConfig,
  INDIA_PHONE_NUMBER,
  VAPI_PUBLIC_KEY,
  SUPABASE_URL
} = require('../config');
const { getAnalyticsKPIs } = require('../services/analyticsService');

const FRONTEND_DIST = path.join(ROOT_DIR, 'frontend', 'dist');

// Health Check
router.get('/health', (_req, res) => {
  const config = getConfig();
  res.json({
    status: 'ok',
    company: 'Codevirus Security',
    assistantId: config.assistantId || null,
    tunnel: config.webhookUrl || null
  });
});

// Sanitized Config
router.get('/config', (_req, res) => {
  const config = reloadConfig();
  res.json({
    assistantId: config.assistantId || null,
    phoneNumberId: config.phoneNumberId || null,
    indiaPhoneNumber: INDIA_PHONE_NUMBER,
    vapiPublicKey: config.vapiPublicKey || VAPI_PUBLIC_KEY || null,
    supabaseUrl: config.supabaseUrl || SUPABASE_URL || null,
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY || '',
    webhookUrl: config.webhookUrl || null,
    tunnelUrl: config.tunnelUrl || null
  });
});

// Operations Analytics & Activity
router.get('/api/analytics', (_req, res) => {
  res.json(getAnalyticsKPIs());
});

router.get('/api/activity', (_req, res) => {
  res.json(store.getActivity());
});

// Legacy HTML redirects to modern React tabs
router.get('/dashboard.html', (_req, res) => res.redirect('/'));
router.get('/BookingCalendar.html', (_req, res) => res.redirect('/calendar'));
router.get('/whatsapp.html', (_req, res) => res.redirect('/whatsapp'));

// React Single Page Application (SPA) Serving
router.get(['/', '/dashboard', '/calendar', '/whatsapp'], (_req, res) => {
  const reactIndex = path.join(FRONTEND_DIST, 'index.html');
  if (fs.existsSync(reactIndex)) {
    return res.sendFile(reactIndex);
  }
  return res.status(500).send('React frontend bundle missing. Run "npm run build".');
});

module.exports = router;

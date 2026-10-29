/**
 * Codevirus Security — Dormant Prospects & Extracted Leads Routes
 */

const express = require('express');
const router = express.Router();
const store = require('../db/localStore');
const supabase = require('../db/supabase');
const { requireAdminAuth } = require('../middleware/auth');
const { exportLimiter } = require('../middleware/security');

// 1. Get dormant prospects
const getDormant = async (_req, res) => {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('dormant_patients')
        .select('*')
        .order('last_visit', { ascending: true });
      if (!error && Array.isArray(data) && data.length > 0) {
        store.setDormant(data);
        return res.json(data);
      }
    } catch {}
  }
  res.json(store.getDormant());
};

router.get('/dormant', getDormant);
router.get('/dormant-patients', getDormant);

// 2. Reactivate dormant prospect
const reactivateDormant = async (req, res) => {
  const { id } = req.params;
  const list = store.getDormant();
  const lead = list.find((r) => r.id === id);
  if (!lead) return res.status(404).json({ error: 'Dormant lead not found' });

  store.updateDormantStatus(id, 'reactivated');
  if (supabase) {
    try {
      await supabase.from('dormant_patients').update({ reactivation_status: 'reactivated' }).eq('id', id);
    } catch {}
  }
  res.json({ success: true, id, status: 'reactivated', lead });
};

router.post('/dormant/:id/reactivate', reactivateDormant);
router.post('/dormant-patients/:id/reactivate', reactivateDormant);

// 3. Get calling queue leads
router.get('/leads', async (_req, res) => {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('demo_leads')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error && Array.isArray(data) && data.length > 0) {
        return res.json(data);
      }
    } catch {}
  }
  res.json(store.getLeads());
});

// 4. Mark lead processed
router.post('/leads/:id/process', async (req, res) => {
  const { id } = req.params;
  store.markLeadProcessed(id);
  if (supabase) {
    try {
      await supabase.from('demo_leads').update({ processed: true }).eq('id', id);
    } catch {}
  }
  res.json({ success: true, id });
});

module.exports = router;

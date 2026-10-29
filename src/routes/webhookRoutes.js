/**
 * Codevirus Security — AI Voice Telephony & Webhook Routes
 */

const express = require('express');
const router = express.Router();
const supabase = require('../db/supabase');
const store = require('../db/localStore');
const {
  verifyWebhookSecret,
  handleVapiWebhook,
  triggerOutboundCall
} = require('../services/telephonyService');
const { outboundCallLimiter } = require('../middleware/security');
const { requireAdminAuth } = require('../middleware/auth');

// 1. Vapi Main Webhook Handler (Accepts /webhook, /api/vapi-webhook, /api/webhook)
const handleWebhookRequest = async (req, res) => {
  if (!verifyWebhookSecret(req)) {
    console.warn('[webhook] ❌ Unauthorized webhook request — secret mismatch.');
    return res.status(401).json({ error: 'Unauthorized: invalid webhook secret' });
  }

  const { response } = await handleVapiWebhook(req.body);
  return res.json(response);
};

router.post(['/webhook', '/api/vapi-webhook', '/api/webhook'], handleWebhookRequest);

// 2. Trigger Outbound Call
router.post(['/trigger-outbound', '/api/trigger-outbound'], outboundCallLimiter, requireAdminAuth, async (req, res) => {
  const { phone, patient_name, candidate_name, call_type } = req.body;
  const targetName = patient_name || candidate_name;

  if (!phone || !targetName) {
    return res.status(400).json({ error: 'phone and patient_name are required' });
  }

  try {
    const data = await triggerOutboundCall(phone, targetName, call_type);
    res.json({ success: true, callId: data.id, patient_name: targetName, call_type });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Call Logs Endpoint
router.get('/api/call-logs', async (_req, res) => {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('call_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      if (!error && Array.isArray(data)) {
        return res.json(data);
      }
    } catch {}
  }

  // Fallback to call activities
  const callActivities = store
    .getActivity()
    .filter((a) => a.type?.startsWith('call_'));
  res.json(callActivities);
});

module.exports = router;

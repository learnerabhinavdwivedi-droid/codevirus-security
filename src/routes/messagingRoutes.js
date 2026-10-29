/**
 * Codevirus Security — Messaging & WhatsApp Console Routes
 */

const express = require('express');
const router = express.Router();
const store = require('../db/localStore');
const supabase = require('../db/supabase');
const {
  generateSarahReply,
  escapeXml,
  dispatchMetaWhatsApp
} = require('../services/messagingService');
const { chatReplyLimiter } = require('../middleware/security');

// 1. Get messages history
router.get('/messages', async (_req, res) => {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('demo_messages')
        .select('*')
        .order('created_at', { ascending: true });
      if (!error && Array.isArray(data) && data.length > 0) {
        return res.json(data);
      }
    } catch {}
  }
  res.json(store.getMessages());
});

// 2. Post message
router.post('/messages', async (req, res) => {
  const { text, is_lead, sender, chat_id } = req.body;
  const saved = store.addMessage({ text, is_lead, sender, chat_id });
  if (supabase) {
    try {
      await supabase.from('demo_messages').insert([
        {
          chat_id: chat_id || '+91 96487 77706',
          sender: sender || 'business',
          text,
          is_lead: Boolean(is_lead)
        }
      ]);
    } catch {}
  }
  res.json({ success: true, message: saved });
});

// 3. Sarah AI WhatsApp Reply
router.post('/chat-reply', chatReplyLimiter, async (req, res) => {
  const { message, chat_id, history } = req.body;
  if (!message) {
    return res.status(400).json({ error: 'message is required' });
  }

  // Record incoming lead message
  store.addMessage({
    text: message,
    is_lead: true,
    sender: 'lead',
    chat_id: chat_id || '+91 96487 77706'
  });

  // Generate Sarah reply
  const reply = await generateSarahReply(message, history);

  // Record outgoing reply
  store.addMessage({
    text: reply,
    is_lead: false,
    sender: 'business',
    chat_id: chat_id || '+91 96487 77706'
  });

  store.addActivity({
    type: 'chat_reply',
    title: 'Sarah WhatsApp AI Reply',
    detail: `Replying: "${reply.substring(0, 50)}..."`,
    tone: 'green'
  });

  res.json({ success: true, reply });
});

// 4. Meta WhatsApp Verification
router.get('/webhook/whatsapp', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN || 'codevirus_secret_token_2026';

  if (mode === 'subscribe' && token === verifyToken) {
    console.log('[whatsapp-meta] ✓ Webhook verified successfully by Meta');
    return res.status(200).send(challenge);
  }
  return res.sendStatus(403);
});

// 5. Meta WhatsApp Inbound Webhook
router.post('/webhook/whatsapp', async (req, res) => {
  try {
    const entry = req.body?.entry?.[0];
    const change = entry?.changes?.[0]?.value;
    const message = change?.messages?.[0];
    const contact = change?.contacts?.[0];

    if (message && message.type === 'text') {
      const fromNumber = message.from;
      const text = message.text.body;
      const senderName = contact?.profile?.name || fromNumber;

      console.log(`[whatsapp-meta] Inbound from ${senderName} (+${fromNumber}): "${text}"`);

      store.addMessage({
        chat_id: `+${fromNumber}`,
        sender: 'lead',
        text,
        is_lead: true
      });

      const reply = await generateSarahReply(text);
      store.addMessage({
        chat_id: `+${fromNumber}`,
        sender: 'business',
        text: reply,
        is_lead: false
      });

      await dispatchMetaWhatsApp(fromNumber, reply);
    }
  } catch (err) {
    console.error('[whatsapp-meta] Payload error:', err.message);
  }
  res.sendStatus(200);
});

// 6. Twilio WhatsApp Inbound Webhook
router.post('/webhook/twilio-whatsapp', async (req, res) => {
  try {
    const from = req.body.From || '';
    const body = req.body.Body || '';
    const cleanPhone = from.replace('whatsapp:', '');

    store.addMessage({
      chat_id: cleanPhone,
      sender: 'lead',
      text: body,
      is_lead: true
    });

    const reply = await generateSarahReply(body);
    store.addMessage({
      chat_id: cleanPhone,
      sender: 'business',
      text: reply,
      is_lead: false
    });

    res.setHeader('Content-Type', 'text/xml');
    return res.send(`<?xml version="1.0" encoding="UTF-8"?><Response><Message>${escapeXml(reply)}</Message></Response>`);
  } catch (err) {
    console.error('[twilio-whatsapp] Error:', err.message);
    res.setHeader('Content-Type', 'text/xml');
    return res.send(`<?xml version="1.0" encoding="UTF-8"?><Response></Response>`);
  }
});

module.exports = router;

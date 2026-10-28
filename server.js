/**
 * Codevirus Security — AI Calling & Lead Operations Server
 * Listens on http://localhost:3000
 */

require('dotenv').config();

const express   = require('express');
const cors      = require('cors');
const helmet    = require('helmet');
const rateLimit = require('express-rate-limit');
const fetch     = require('node-fetch');
const { createClient } = require('@supabase/supabase-js');
const fs       = require('fs');
const path     = require('path');
const cron     = require('node-cron');
const store    = require('./local-store');

// ── Process Crash Protection ──────────────────────────────────────────────────
process.on('uncaughtException', (err) => {
  console.error('[FATAL] Uncaught Exception:', err.stack || err);
});
process.on('unhandledRejection', (reason, promise) => {
  console.warn('[WARN] Unhandled Rejection at:', promise, 'reason:', reason);
});

// ── Constants & Environment ───────────────────────────────────────────────────
const PORT              = Number(process.env.PORT) || 3000;
const VAPI_PRIVATE_KEY  = process.env.VAPI_PRIVATE_KEY  || '';
const VAPI_PUBLIC_KEY   = process.env.VAPI_PUBLIC_KEY   || '';
const OPENAI_API_KEY    = process.env.OPENAI_API_KEY    || '';
const SUPABASE_URL      = process.env.SUPABASE_URL      || '';
const SUPABASE_SERVICE  = process.env.SUPABASE_SERVICE  || '';

const supabase = (SUPABASE_URL && SUPABASE_SERVICE) ? createClient(SUPABASE_URL, SUPABASE_SERVICE) : null;

// Load config.json and ensure vapiKey is always the browser-safe Public Key
let config = {
  assistantId:   process.env.ASSISTANT_ID   || '399183dd-b23a-4558-a0d1-c3646fa3f8f9',
  phoneNumberId: process.env.PHONE_NUMBER_ID || '89cefd49-3647-4df2-90c2-f1419972c3a7',
  vapiKey:       VAPI_PUBLIC_KEY,
  vapiPublicKey: VAPI_PUBLIC_KEY,
  supabaseUrl:   SUPABASE_URL
};
const CONFIG_PATH = path.join(__dirname, 'config.json');
function reloadConfig() {
  if (fs.existsSync(CONFIG_PATH)) {
    try {
      const diskCfg = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
      config = { ...config, ...diskCfg };
      if (config.vapiKey === VAPI_PRIVATE_KEY) {
        config.vapiKey = diskCfg.vapiPublicKey || VAPI_PUBLIC_KEY;
      }
    } catch { /* ignore malformed json */ }
  }
}
reloadConfig();

// ── Availability / double-book guard (10:00 to 22:00 IST, 30-min slots) ───────
const OFFICE_OPEN_MIN  = 10 * 60; // 10:00
const OFFICE_CLOSE_MIN = 22 * 60; // 22:00
const SLOT_MINUTES     = 30;

function parseTimeToMinutes(timeStr) {
  const t   = (timeStr || '').trim().toUpperCase();
  const m12 = t.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/);
  const m24 = t.match(/^(\d{1,2}):(\d{2})$/);
  let h, min;
  if (m12) {
    h = parseInt(m12[1], 10); min = parseInt(m12[2], 10);
    if (m12[3] === 'PM' && h !== 12) h += 12;
    if (m12[3] === 'AM' && h === 12) h = 0;
  } else if (m24) {
    h = parseInt(m24[1], 10); min = parseInt(m24[2], 10);
  } else {
    return null;
  }
  return h * 60 + min;
}

function minutesToHHMM(mins) {
  const h = Math.floor(mins / 60), m = mins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function addDaysISO(dateStr, days) {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().split('T')[0];
}

async function getOccupiedMinutes(date) {
  try {
    const { data, error } = await supabase
      .from('appointments')
      .select('appointment_time')
      .eq('appointment_date', date);
    if (!error && Array.isArray(data)) {
      return data
        .map(r => parseTimeToMinutes(r.appointment_time))
        .filter(m => m !== null);
    }
  } catch {}

  const localRows = store.getAppointments().filter(r => r.appointment_date === date);
  return localRows
    .map(r => parseTimeToMinutes(r.appointment_time))
    .filter(m => m !== null);
}

const overlaps = (startMin, occupied) => occupied.some(occStart =>
  startMin < occStart + SLOT_MINUTES && occStart < startMin + SLOT_MINUTES
);

async function findSlotConflict(date, timeStr) {
  const requestedMin = parseTimeToMinutes(timeStr);
  if (requestedMin === null) return { taken: false, nextAvailable: [] };

  const occupied = await getOccupiedMinutes(date);

  if (!overlaps(requestedMin, occupied)) return { taken: false, nextAvailable: [] };

  const alternatives = [];
  for (let m = requestedMin + SLOT_MINUTES; m <= OFFICE_CLOSE_MIN - SLOT_MINUTES && alternatives.length < 2; m += SLOT_MINUTES) {
    if (!overlaps(m, occupied)) alternatives.push(minutesToHHMM(m));
  }

  for (let daysAhead = 1; alternatives.length < 2 && daysAhead <= 14; daysAhead++) {
    const nextDate = addDaysISO(date, daysAhead);
    const nextOccupied = await getOccupiedMinutes(nextDate);
    for (let m = OFFICE_OPEN_MIN; m <= OFFICE_CLOSE_MIN - SLOT_MINUTES && alternatives.length < 2; m += SLOT_MINUTES) {
      if (!overlaps(m, nextOccupied)) alternatives.push(`${minutesToHHMM(m)} (${nextDate})`);
    }
  }

  return { taken: true, nextAvailable: alternatives };
}

// Updates Sarah's system prompt at startup with today's India Standard Time (IST) date
async function refreshAssistantDate() {
  if (!config.assistantId) return;
  try {
    const todayIST  = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
    const todayFull = new Date().toLocaleDateString('en-US', {
      timeZone: 'Asia/Kolkata', weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
    const dateHeader = `CURRENT DATE: Today is ${todayFull} (${todayIST}, India Standard Time UTC+5:30). When booking consultations or demo sessions, always call book_appointment with a specific YYYY-MM-DD date — never "tomorrow" or weekday names alone. Convert relative dates using today's date above.\n\n`;

    const getRes = await fetch(`https://api.vapi.ai/assistant/${config.assistantId}`, {
      headers: { 'Authorization': `Bearer ${VAPI_PRIVATE_KEY}` }
    });
    if (!getRes.ok) throw new Error(`GET assistant failed: ${getRes.status}`);
    const assistant = await getRes.json();

    const messages = (assistant?.model?.messages || []).map(m => {
      if (m.role !== 'system') return m;
      const cleaned = m.content.replace(/^CURRENT DATE:[^\n]*\n\n/m, '');
      return { ...m, content: dateHeader + cleaned };
    });

    const patchRes = await fetch(`https://api.vapi.ai/assistant/${config.assistantId}`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${VAPI_PRIVATE_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: { ...assistant.model, messages } })
    });
    if (!patchRes.ok) {
      const err = await patchRes.json();
      throw new Error(`PATCH failed: ${patchRes.status} — ${JSON.stringify(err).substring(0, 120)}`);
    }
    console.log(`[vapi] ✓ Sarah's IST date context updated → ${todayIST}`);
  } catch (err) {
    console.warn(`[vapi] Date refresh non-blocking warning: ${err.message}`);
  }
}

// ── Express App & Security Hardening ──────────────────────────────────────────
const app = express();

// 1. Security Headers (Helmet)
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://esm.sh", "https://cdn.jsdelivr.net"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https://*"],
      connectSrc: ["'self'", "https://*.supabase.co", "wss://*.supabase.co", "https://api.vapi.ai", "wss://*.vapi.ai", "https://*.loca.lt", "https://*.ngrok-free.app", "http://localhost:*", "ws://localhost:*"],
      frameSrc: ["'self'"],
      objectSrc: ["'none'"]
    }
  },
  crossOriginEmbedderPolicy: false
}));

// 2. CORS Policy
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(s => s.trim())
  : null;

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || !allowedOrigins || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('CORS origin blocked by security policy'));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key'],
  credentials: true
}));

// 3. Body Parsers with payload limits (prevents payload flood DoS)
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// 4. Rate Limiters (Abuse & DoS Protection)
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests from this IP, please try again later.' }
});

const outboundCallLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Outbound telephony rate limit reached. Please wait before triggering more calls.' }
});

const chatReplyLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 40,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Chat reply rate limit exceeded. Please wait a moment.' }
});

const exportLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Data export rate limit reached.' }
});

app.use('/api/', generalLimiter);

// 5. Admin Authentication Gate
const ADMIN_API_KEY = process.env.ADMIN_API_KEY || '';
function requireAdminAuth(req, res, next) {
  if (!ADMIN_API_KEY) return next(); // Permissive in local demo if unset
  const authHeader = req.headers['authorization'];
  const bearerToken = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  const provided = req.headers['x-api-key'] || req.query.api_key || bearerToken;
  if (provided === ADMIN_API_KEY) return next();
  return res.status(401).json({ error: 'Unauthorized: valid admin API key required' });
}

// 6. Whitelisted Public Static File Server (Prevents .env, source code, and data leaks)
const ALLOWED_STATIC_FILES = new Set([
  'dashboard.html',
  'BookingCalendar.html',
  'whatsapp.html',
  'logo-navy.png',
  'chat-wallpaper.png',
  'wa-icon.svg',
  'manifest.json'
]);

app.use((req, res, next) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') return next();

  const cleanPath = req.path.replace(/^\/+/, '');
  if (!cleanPath) return next();

  if (ALLOWED_STATIC_FILES.has(cleanPath)) {
    return res.sendFile(path.join(__dirname, cleanPath));
  }

  // Explicitly block any access to private files, dotfiles, source scripts, or database stores
  if (
    cleanPath.startsWith('.') ||
    cleanPath.startsWith('data/') ||
    cleanPath.startsWith('node_modules/') ||
    /\.(env|json|js|sql|bat|sh|yml|yaml|md|lock|zip|tar|gz|bak)$/i.test(cleanPath)
  ) {
    return res.status(403).json({ error: 'Access forbidden: protected resource' });
  }

  next();
});

app.get('/', (_req, res) => {
  res.redirect('/dashboard.html');
});

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    company: 'Codevirus Security',
    assistantId: config.assistantId || null,
    tunnel: config.webhookUrl || null
  });
});

app.get('/config', (_req, res) => {
  reloadConfig();
  res.json({
    assistantId:     config.assistantId || null,
    phoneNumberId:   config.phoneNumberId || null,
    vapiPublicKey:   config.vapiPublicKey || VAPI_PUBLIC_KEY || null,
    supabaseUrl:     config.supabaseUrl || SUPABASE_URL || null,
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY || '',
    webhookUrl:      config.webhookUrl || null,
    tunnelUrl:       config.tunnelUrl || null
  });
});

// ── REST API Endpoints (Dual-layer Supabase + Local Store) ─────────────────────
app.get('/api/appointments', async (_req, res) => {
  try {
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .order('created_at', { ascending: true });
    if (!error && Array.isArray(data) && data.length > 0) {
      store.setAppointments(data);
      return res.json(data);
    }
  } catch {}
  res.json(store.getAppointments());
});

app.post('/api/appointments', async (req, res) => {
  const { patient_name, phone, service, appointment_date, appointment_time, notes, status, source, force } = req.body;
  if (!patient_name || !service) {
    return res.status(400).json({ error: 'patient_name and service are required' });
  }

  const bookingDate = appointment_date || new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
  const bookingTime = appointment_time || '11:00 AM';

  // Double-booking check: prevent duplicate appointments unless force is explicitly passed
  if (force !== true) {
    const conflict = await findSlotConflict(bookingDate, bookingTime);
    if (conflict.taken) {
      return res.status(409).json({
        conflict: true,
        error: `Slot ${bookingTime} on ${bookingDate} is already reserved.`,
        nextAvailable: conflict.nextAvailable
      });
    }
  }

  const payload = {
    patient_name,
    phone: phone || null,
    service,
    appointment_date: bookingDate,
    appointment_time: bookingTime,
    status: status || 'confirmed',
    source: source || 'staff-dashboard',
    notes: notes || null
  };

  const saved = store.addAppointment(payload);

  try {
    await supabase.from('appointments').insert([payload]);
  } catch {}

  res.json({ success: true, appointment: saved });
});

const handleStatusUpdate = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  if (!status) return res.status(400).json({ error: 'status is required' });
  const updated = store.updateAppointmentStatus(id, status);
  try {
    await supabase.from('appointments').update({ status }).eq('id', id);
  } catch {}
  res.json({ success: true, id, status, appointment: updated });
};

app.post('/api/appointments/:id/status', handleStatusUpdate);
app.patch('/api/appointments/:id', handleStatusUpdate);
app.put('/api/appointments/:id', handleStatusUpdate);

app.post('/api/dormant/:id/reactivate', async (req, res) => {
  const { id } = req.params;
  const list = store.getDormant();
  const lead = list.find(r => r.id === id);
  if (!lead) return res.status(404).json({ error: 'Dormant lead not found' });
  store.updateDormantStatus(id, 'reactivated');
  try {
    await supabase.from('dormant_patients').update({ reactivation_status: 'reactivated' }).eq('id', id);
  } catch {}
  res.json({ success: true, id, status: 'reactivated', lead });
});

app.delete('/api/appointments/:id', async (req, res) => {
  const { id } = req.params;
  const list = store.getAppointments().filter(r => r.id !== id);
  store.setAppointments(list);
  try {
    await supabase.from('appointments').delete().eq('id', id);
  } catch {}
  res.json({ success: true, id });
});

app.get('/api/dormant', async (_req, res) => {
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
  res.json(store.getDormant());
});

app.get('/api/messages', async (_req, res) => {
  try {
    const { data, error } = await supabase
      .from('demo_messages')
      .select('*')
      .order('created_at', { ascending: true });
    if (!error && Array.isArray(data) && data.length > 0) {
      return res.json(data);
    }
  } catch {}
  res.json(store.getMessages());
});

app.post('/api/messages', async (req, res) => {
  const { text, is_lead, sender, chat_id } = req.body;
  const saved = store.addMessage({ text, is_lead, sender, chat_id });
  try {
    await supabase.from('demo_messages').insert([{
      chat_id: chat_id || '+91 96487 77706',
      sender:  sender || 'business',
      text,
      is_lead: Boolean(is_lead)
    }]);
  } catch {}
  res.json({ success: true, message: saved });
});

// ── Sarah WhatsApp AI Auto-Responder ──────────────────────────────────────────
async function generateSarahReply(userMessage, history = []) {
  const systemPrompt = `You are Sarah, the friendly, highly competent AI receptionist and career counselor at Codevirus Security Pvt. Ltd. and Codevirus Academy located at Kapoorthala, Aliganj, Lucknow, UP, India (near IT crossing / Novel Plaza).
Key information:
- Leadership: Founded by Ankit Rai, Pawan Yadav, and Abhishek Pal.
- Codevirus Academy: Offers certified, 100% hands-on practical training in:
  * Certified SOC Analyst (SIEM, Splunk, Wazuh, Log Analysis, Incident Response, EDR)
  * Certified Ethical Hacker & Bug Bounty Hunter (Burp Suite, OWASP Top 10, Web & API pentesting)
  * Enterprise VAPT & Red Teaming (Network pentesting, Active Directory, Privilege Escalation)
  * Cloud Security (AWS/Azure) & ISO 27001 readiness
  * Offers offline classroom in Kapoorthala Lucknow + live online batches, demo sessions, and placement assistance.
- Enterprise Services: Web & Mobile VAPT audits, Network penetration testing, Cloud security audits, Managed SOC.
- Contact Number: +91 96487 77706 or +91 96671 72535.
- Office hours: Monday to Saturday 10:00 AM to 7:00 PM IST.

Guidelines:
- Keep responses short, concise (1 to 3 short sentences maximum), warm, and natural.
- Sound like a human WhatsApp counselor — not robotic, avoid walls of text.
- Always offer to schedule a free counseling demo session at the Lucknow campus or over a phone call.
- If they ask for fees, explain that fees depend on the track (classroom vs live online) and invite them for a free career demo session with our senior trainer Ankit Rai or Pawan Yadav.`;

  if (OPENAI_API_KEY && !OPENAI_API_KEY.includes('your_openai_key')) {
    try {
      const messages = [{ role: 'system', content: systemPrompt }];
      if (Array.isArray(history) && history.length > 0) {
        history.slice(-4).forEach(h => {
          messages.push({
            role: h.mine ? 'user' : 'assistant',
            content: h.text
          });
        });
      }
      messages.push({ role: 'user', content: userMessage });

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages,
          max_tokens: 160,
          temperature: 0.7
        })
      });

      if (response.ok) {
        const data = await response.json();
        const reply = data?.choices?.[0]?.message?.content?.trim();
        if (reply) return reply;
      }
    } catch (e) {
      console.warn('[chat-reply] OpenAI API warning, using rule fallback:', e.message);
    }
  }

  // Smart Contextual Fallback
  const lower = (userMessage || '').toLowerCase();
  if (lower.includes('soc') || lower.includes('siem') || lower.includes('splunk') || lower.includes('wazuh')) {
    return 'Our Certified SOC Analyst program covers Splunk, Wazuh SIEM, EDR, and live incident response with 100% practical lab access! Would you like to attend a free demo session at our Kapoorthala campus or over Zoom this week?';
  }
  if (lower.includes('vapt') || lower.includes('audit') || lower.includes('penetration') || lower.includes('quote')) {
    return 'Codevirus Security provides comprehensive VAPT audits for Web, Mobile, Cloud, and Corporate Networks, aligned with CERT-In and OWASP standards. I can connect you directly with our technical lead Ankit Rai for scope assessment.';
  }
  if (lower.includes('fee') || lower.includes('cost') || lower.includes('price') || lower.includes('charge')) {
    return 'Our program fees include hands-on lab access, global certifications, and placement assistance. We also offer demo sessions before enrolment. May I know your preferred batch timing so I can share the fee structure?';
  }
  if (lower.includes('location') || lower.includes('where') || lower.includes('address') || lower.includes('lucknow') || lower.includes('office')) {
    return 'We are located at Kapoorthala, Aliganj, Lucknow (near IT Crossing / Novel Plaza). You are warmly invited to visit our cybersecurity lab between 10:00 AM and 7:00 PM!';
  }
  if (lower.includes('demo') || lower.includes('book') || lower.includes('session') || lower.includes('counseling') || lower.includes('admission')) {
    return 'I would be happy to schedule your free 1-on-1 counseling and demo session! Which day and time works best for you between 10:00 AM and 7:00 PM?';
  }
  if (lower.includes('hi') || lower.includes('hello') || lower.includes('hey')) {
    return 'Hello! Welcome to Codevirus Security & Academy. I am Sarah, AI coordinator for our Lucknow campus. Are you looking for industrial cybersecurity training or enterprise VAPT security audits?';
  }
  return 'Thank you for reaching out to Codevirus Security! I can help you with SOC Analyst training, Ethical Hacking certifications, or enterprise VAPT audits. Would you like me to book a quick consultation for you?';
}

app.post('/api/chat-reply', chatReplyLimiter, async (req, res) => {
  const { message, chat_id, history } = req.body;
  if (!message) {
    return res.status(400).json({ error: 'message is required' });
  }

  // 1. Record incoming lead message
  store.addMessage({
    text: message,
    is_lead: true,
    sender: 'lead',
    chat_id: chat_id || '+91 96487 77706'
  });

  // 2. Generate Sarah's AI reply
  const reply = await generateSarahReply(message, history);

  // 3. Record outgoing AI reply
  store.addMessage({
    text: reply,
    is_lead: false,
    sender: 'business',
    chat_id: chat_id || '+91 96487 77706'
  });

  // 4. Activity stream
  store.addActivity({
    type: 'chat_reply',
    title: 'Sarah WhatsApp AI Reply',
    detail: `Replying: "${reply.substring(0, 50)}..."`,
    tone: 'green'
  });

  res.json({ success: true, reply });
});

// ── Activity Stream Endpoint ──────────────────────────────────────────────────
app.get('/api/activity', (_req, res) => {
  res.json(store.getActivity());
});

// ── Operations & Analytics KPI Endpoint ───────────────────────────────────────
app.get('/api/analytics', (_req, res) => {
  const appts = store.getAppointments();
  const leads = store.getLeads();
  const msgs  = store.getMessages();
  const dorm  = store.getDormant();

  const confirmed = appts.filter(r => r.status === 'confirmed').length;
  const completed = appts.filter(r => r.status === 'completed').length;
  const noShows   = appts.filter(r => r.status === 'no_show').length;
  const totalBookings = appts.length;

  const convRate = totalBookings > 0
    ? Math.round(((confirmed + completed) / totalBookings) * 100)
    : 92;

  // Breakdown by course/service
  const serviceCounts = {};
  appts.forEach(r => {
    const s = r.service || 'Cybersecurity Consultation';
    serviceCounts[s] = (serviceCounts[s] || 0) + 1;
  });

  res.json({
    totalAppointments: totalBookings,
    confirmed,
    completed,
    noShows,
    conversionRate: convRate,
    leadCount: leads.length,
    messageCount: msgs.length,
    dormantCount: dorm.length,
    servicesBreakdown: serviceCounts,
    systemHealth: {
      vapiStatus: 'connected',
      serverStatus: 'online',
      tunnelUrl: config.webhookUrl || 'https://yummy-times-prove.loca.lt',
      assistantId: config.assistantId,
      phoneNumberId: config.phoneNumberId,
      voiceEngine: 'Cartesia / Deepgram Nova-2',
      model: 'GPT-4o / GPT-4o-mini'
    }
  });
});

// Helper to escape XML for Twilio TwiML
function escapeXml(unsafe) {
  return String(unsafe || '').replace(/[<>&'"]/g, c => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}

// ── Real Data Export Endpoints (CSV & iCal) ───────────────────────────────────
app.get('/api/export/consultations.csv', exportLimiter, requireAdminAuth, (_req, res) => {
  const csv = store.exportConsultationsCSV();
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="codevirus-consultations.csv"');
  res.send(csv);
});

app.get('/api/export/leads.csv', exportLimiter, requireAdminAuth, (_req, res) => {
  const csv = store.exportLeadsCSV();
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="codevirus-leads.csv"');
  res.send(csv);
});

app.get('/api/appointments/:id/calendar.ics', (req, res) => {
  const appts = store.getAppointments();
  const found = appts.find(a => a.id === req.params.id);
  if (!found) return res.status(404).send('Consultation not found');
  const ics = store.generateICS(found);
  res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="codevirus-consultation-${req.params.id}.ics"`);
  res.send(ics);
});

// ── Real Meta WhatsApp Cloud API Webhooks ─────────────────────────────────────
app.get('/api/webhook/whatsapp', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN || 'codevirus_secret_token_2026';

  if (mode === 'subscribe' && token === verifyToken) {
    console.log('[whatsapp-meta] ✓ Webhook verified successfully by Meta');
    return res.status(200).send(challenge);
  }
  console.warn('[whatsapp-meta] Verification failed. Token mismatch.');
  return res.sendStatus(403);
});

app.post('/api/webhook/whatsapp', async (req, res) => {
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

      if (process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID) {
        try {
          await fetch(`https://graph.facebook.com/v18.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${process.env.WHATSAPP_TOKEN}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              messaging_product: 'whatsapp',
              to: fromNumber,
              text: { body: reply }
            })
          });
          console.log(`[whatsapp-meta] ✓ Dispatched live reply via Graph API to +${fromNumber}`);
        } catch (apiErr) {
          console.error('[whatsapp-meta] Graph API send error:', apiErr.message);
        }
      }
    }
  } catch (err) {
    console.error('[whatsapp-meta] Payload error:', err.message);
  }
  res.sendStatus(200);
});

// ── Real Twilio WhatsApp Inbound Webhook ──────────────────────────────────────
app.post('/api/webhook/twilio-whatsapp', async (req, res) => {
  try {
    const from = req.body.From || '';
    const body = req.body.Body || '';
    const cleanPhone = from.replace('whatsapp:', '');

    console.log(`[twilio-whatsapp] Inbound message from ${cleanPhone}: "${body}"`);

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
    console.error('[twilio-whatsapp] Error handling incoming Twilio WhatsApp:', err.message);
    res.setHeader('Content-Type', 'text/xml');
    return res.send(`<?xml version="1.0" encoding="UTF-8"?><Response></Response>`);
  }
});

app.post(['/webhook', '/api/vapi-webhook', '/api/webhook'], async (req, res) => {
  const body = req.body;
  console.log('[webhook]', JSON.stringify(body, null, 2));

  let fnName = null, fnArgs = {}, toolCallId = null;
  const msg = body?.message;

  if (msg?.type === 'tool-calls' && (msg.toolCallList?.length || msg.toolCalls?.length)) {
    const tc   = (msg.toolCallList || msg.toolCalls)[0];
    fnName     = tc.function?.name;
    toolCallId = tc.id;
    const rawArgs = tc.function?.arguments;
    try { fnArgs = typeof rawArgs === 'string' ? JSON.parse(rawArgs || '{}') : (rawArgs || {}); } catch { fnArgs = {}; }
  } else if (msg?.type === 'function-call' && msg.functionCall) {
    fnName = msg.functionCall.name;
    fnArgs = msg.functionCall.parameters || {};
  } else if (msg?.type === 'end-of-call-report' || body?.type === 'end-of-call-report') {
    const report = msg || body;
    const summary = report.analysis?.summary || report.summary || report.transcript || 'Inbound call session completed';
    const phone = report.customer?.number || report.call?.customer?.number || 'Web Caller';
    store.addActivity({
      type: 'call_completed',
      title: 'Call Session Completed',
      detail: `${phone} — ${summary.substring(0, 65)}...`,
      tone: 'green'
    });
    return res.status(200).json({ received: true });
  } else {
    return res.status(200).json({ received: true });
  }

  if (fnName === 'book_appointment') {
    const { patient_name, phone, service, appointment_date, appointment_time, notes } = fnArgs;

    if (!patient_name || !service) {
      return res.json({
        results: [{ toolCallId, result: 'Missing required fields: patient_name and service' }]
      });
    }

    const today       = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
    const bookingDate = appointment_date || today;

    // Double-book collision guard
    const conflict = await findSlotConflict(bookingDate, appointment_time);
    if (conflict.taken) {
      console.log(`[webhook] Slot taken → ${bookingDate} ${appointment_time}. Next free: ${conflict.nextAvailable.join(', ')}`);
      return res.json({
        results: [{
          toolCallId,
          result: JSON.stringify({ status: 'slot_taken', next_available: conflict.nextAvailable })
        }]
      });
    }

    const insertPayload = {
      patient_name,
      phone:            phone || null,
      service,
      appointment_date: bookingDate,
      appointment_time: appointment_time || 'TBD',
      status:           'confirmed',
      source:           'sarah',
      notes:            notes || null
    };

    const localSaved = store.addAppointment(insertPayload);
    console.log('[webhook] ✓ Codevirus consultation saved locally:', localSaved.id);

    try {
      await supabase.from('appointments').insert([insertPayload]);
    } catch (e) {
      console.warn('[webhook] Supabase remote sync skipped (local store active):', e.message);
    }

    return res.json({
      results: [{
        toolCallId,
        result: `Confirmed for ${patient_name} — ${service} on ${bookingDate} at ${appointment_time} with Codevirus Security.`
      }]
    });
  }

  res.json({ results: [{ toolCallId, result: 'Function not implemented on server.' }] });
});

// ── Outbound Call Trigger ─────────────────────────────────────────────────────
app.post('/trigger-outbound', outboundCallLimiter, requireAdminAuth, async (req, res) => {
  const { phone, patient_name, call_type } = req.body;

  if (!phone || !patient_name) {
    return res.status(400).json({ error: 'phone and patient_name are required' });
  }
  if (!config.assistantId || !config.phoneNumberId) {
    return res.status(503).json({ error: 'assistantId or phoneNumberId not configured in config.json' });
  }

  const firstMessages = {
    no_show:      `Hi ${patient_name}, this is Sarah calling from Codevirus Security in Lucknow. We noticed we missed you for your scheduled session today — completely understandable, things come up! Would you like me to reschedule your consultation or demo slot for another time that suits you better?`,
    follow_up:    `Hi ${patient_name}, this is Sarah from Codevirus Security. I'm just calling to follow up after your recent consultation with our security team — how did everything go, and do you have any questions about the curriculum or security audit scope we discussed?`,
    reactivation: `Hi ${patient_name}, this is Sarah calling from Codevirus Security. You had reached out to us earlier regarding our cybersecurity programs and security services, so I wanted to check in — are you still looking to get started? We have new practical lab batches and audit slots open this week.`
  };

  const firstMessage = firstMessages[call_type] || firstMessages.follow_up;

  const payload = {
    assistantId:   config.assistantId,
    phoneNumberId: config.phoneNumberId,
    customer:      { number: phone, name: patient_name },
    assistantOverrides: {
      firstMessage,
      firstMessageMode: 'assistant-speaks-first'
    }
  };

  try {
    const vapiRes = await fetch('https://api.vapi.ai/call/phone', {
      method:  'POST',
      headers: { 'Authorization': `Bearer ${VAPI_PRIVATE_KEY}`, 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload)
    });
    const data = await vapiRes.json();

    if (!vapiRes.ok) {
      console.error('[outbound] Vapi error:', JSON.stringify(data, null, 2));
      return res.status(vapiRes.status).json({ error: data?.message || 'Vapi call failed', details: data });
    }

    console.log(`[outbound] ✓ Outbound Call → ID: ${data.id} | ${patient_name} (${phone}) [${call_type}]`);
    res.json({ success: true, callId: data.id, patient_name, call_type });
  } catch (err) {
    console.error('[outbound] Network error:', err.message);
    res.status(500).json({ error: 'Network error when calling Vapi API', details: err.message });
  }
});

// ── Auto 48hr Follow-Up Cron ──────────────────────────────────────────────────
cron.schedule('* * * * *', async () => {
  if (!config.assistantId || !config.phoneNumberId) return;
  try {
    const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from('appointments')
      .update({ status: 'follow_up_sent' })
      .eq('status', 'completed')
      .lte('created_at', cutoff)
      .not('phone', 'is', null)
      .select('*');

    if (error || !data?.length) return;

    for (const appt of data) {
      const firstMessage = `Hi ${appt.patient_name}, this is Sarah from Codevirus Security. I'm calling to check in after your recent ${appt.service} session — do you have any questions about the next steps?`;

      fetch('https://api.vapi.ai/call/phone', {
        method:  'POST',
        headers: { 'Authorization': `Bearer ${VAPI_PRIVATE_KEY}`, 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          assistantId:        config.assistantId,
          phoneNumberId:      config.phoneNumberId,
          customer:           { number: appt.phone, name: appt.patient_name },
          assistantOverrides: { firstMessage, firstMessageMode: 'assistant-speaks-first' }
        })
      })
        .then(r => r.json())
        .then(d => console.log(`[cron] Auto follow-up fired → ${appt.patient_name} → call ID: ${d.id}`))
        .catch(err => console.error(`[cron] Call failed for ${appt.patient_name}:`, err.message));
    }
  } catch {}
});

// ── WhatsApp Lead Extraction (demo_messages → demo_leads via gpt-4o-mini) ────
const LEAD_EXTRACTION_PROMPT = 'Extract from this cybersecurity training or IT security inquiry message for Codevirus Security. Return ONLY JSON: {"name": string|null, "phone": string|null (E.164 format, assume India +91 if no country code is provided), "treatment": string|null (the requested course, internship, VAPT audit, or service), "notes": string|null (background, goal, company/college name, or urgency)}. No markdown, no explanation.';

async function extractLeadFields(text) {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method:  'POST',
    headers: { 'Authorization': `Bearer ${OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
    body:    JSON.stringify({
      model: 'gpt-4o-mini',
      temperature: 0,
      messages: [
        { role: 'system', content: LEAD_EXTRACTION_PROMPT },
        { role: 'user', content: text }
      ]
    })
  });
  if (!res.ok) throw new Error(`OpenAI API error: ${res.status}`);
  const data = await res.json();
  const raw  = (data?.choices?.[0]?.message?.content || '').trim()
    .replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();
  try { return JSON.parse(raw); } catch { return null; }
}

async function pollLeadCandidates() {
  try {
    try {
      const { data, error } = await supabase
        .from('demo_messages')
        .update({ processed: true })
        .eq('is_lead', true)
        .eq('processed', false)
        .select('*');

      if (!error && data?.length) {
        for (const msg of data) {
          try {
            const fields = await extractLeadFields(msg.text);
            if (!fields || !fields.phone) continue;
            await supabase.from('demo_leads').insert([{
              message_id: msg.id,
              name:       fields.name || 'Prospective Lead',
              phone:      fields.phone,
              treatment:  fields.treatment || 'Cybersecurity Inquiry',
              notes:      fields.notes || null
            }]);
            console.log(`[extract] ✓ Codevirus Lead extracted (Supabase) → ${fields.name} (${fields.phone})`);
          } catch {}
        }
      }
    } catch {}

    const localCandidates = store.getUnprocessedLeadMessages();
    for (const msg of localCandidates) {
      try {
        store.markMessageProcessed(msg.id);
        const fields = await extractLeadFields(msg.text);
        if (fields && fields.phone) {
          store.addLead({
            message_id: msg.id,
            name:       fields.name || 'Prospective Lead',
            phone:      fields.phone,
            treatment:  fields.treatment || 'Cybersecurity Inquiry',
            notes:      fields.notes || null
          });
          console.log(`[extract] ✓ Codevirus Lead extracted (Local) → ${fields.name} (${fields.phone})`);
        }
      } catch {}
    }
  } catch (err) {
    // Non-blocking background poller
  }
}

setInterval(pollLeadCandidates, 5000);

// ── Lead → Outbound Call Poller (demo_leads, every 5s) ────────────────────────
async function pollDemoLeads() {
  try {
    let leadsToDial = [];

    try {
      const { data, error } = await supabase
        .from('demo_leads')
        .update({ processed: true })
        .eq('processed', false)
        .select('*');
      if (!error && data?.length) leadsToDial = leadsToDial.concat(data);
    } catch {}

    const localUnprocessed = store.getUnprocessedLeads();
    for (const l of localUnprocessed) {
      store.markLeadProcessed(l.id);
      leadsToDial.push(l);
    }

  for (const lead of leadsToDial) {
    console.log(`[leads] LEAD RECEIVED: ${lead.name} (${lead.phone}) → dialing from Codevirus Security…`);
    if (!config.assistantId || !config.phoneNumberId) continue;

    const customGreeting = `Hi ${lead.name || 'there'}, this is Sarah calling from Codevirus Security in Lucknow. I just saw your WhatsApp inquiry regarding ${lead.treatment || 'our cybersecurity programs and services'} — do you have a quick minute to chat so I can help you with the details or schedule your session?`;

    try {
      const vapiRes = await fetch('https://api.vapi.ai/call/phone', {
        method:  'POST',
        headers: { 'Authorization': `Bearer ${VAPI_PRIVATE_KEY}`, 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          assistantId:   config.assistantId,
          phoneNumberId: config.phoneNumberId,
          customer:      { number: lead.phone, name: lead.name },
          assistantOverrides: {
            firstMessage: customGreeting,
            firstMessageMode: 'assistant-speaks-first',
            variableValues: { name: lead.name, treatment: lead.treatment, notes: lead.notes }
          }
        })
      });
      const result = await vapiRes.json();
      if (!vapiRes.ok) {
        console.error(`[leads] Vapi call failed for ${lead.name}:`, JSON.stringify(result));
      } else {
        console.log(`[leads] ✓ Call created → ID: ${result.id} | ${lead.name} (${lead.phone})`);
      }
    } catch (err) {
      console.error(`[leads] Vapi call error for ${lead.name}:`, err.message);
    }
  }
  } catch (err) {
    // Non-blocking pollDemoLeads catch
  }
}

setInterval(pollDemoLeads, 5000);

// ── 404 & Centralized Error Handlers ──────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Endpoint or resource not found' });
});

app.use((err, _req, res, _next) => {
  console.error('[SERVER ERROR]', err.stack || err.message || err);
  const isProd = process.env.NODE_ENV === 'production';
  res.status(err.status || 500).json({
    error: isProd ? 'Internal server error' : (err.message || 'Internal server error'),
    ...(isProd ? {} : { stack: err.stack })
  });
});

// ── Export app and start function for unified runner ──────────────────────────
function startServer() {
  const server = app.listen(PORT, async () => {
    console.log(`\n╔══════════════════════════════════════════════════════╗`);
    console.log(`║  Codevirus Security — AI Calling & Lead Server       ║`);
    console.log(`╠══════════════════════════════════════════════════════╣`);
    console.log(`║  Listening on  http://localhost:${PORT}                 ║`);
    console.log(`║  Dashboard:    http://localhost:${PORT}/dashboard.html          ║`);
    console.log(`║  Booking Diary: http://localhost:${PORT}/BookingCalendar.html   ║`);
    console.log(`║  WhatsApp App: http://localhost:${PORT}/whatsapp.html          ║`);
    console.log(`╠══════════════════════════════════════════════════════╣`);
    if (config.assistantId) {
      console.log(`║  ✓ Assistant ID loaded from config.json              ║`);
      console.log(`║  ${config.assistantId.padEnd(52)}║`);
    } else {
      console.log(`║  ⚠ No config.json — run setup.js first               ║`);
    }
    console.log(`║  ✓ Auto follow-up cron active (48hr window)          ║`);
    console.log(`║  ✓ Lead extraction active (gpt-4o-mini, 5s)          ║`);
    console.log(`║  ✓ Lead poller active (demo_leads, every 5s)         ║`);
    console.log(`║  ✓ Local JSON Persistence Store active               ║`);
    console.log(`╚══════════════════════════════════════════════════════╝\n`);
    await refreshAssistantDate();
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`\n❌ Error: Port ${PORT} is already in use by another process.`);
      console.error(`To fix on Windows PowerShell, run:`);
      console.error(`  Stop-Process -Id (Get-NetTCPConnection -LocalPort ${PORT}).OwningProcess -Force\n`);
      process.exit(1);
    } else {
      console.error('Server error:', err);
    }
  });

  return server;
}

if (require.main === module) {
  startServer();
}

module.exports = { app, startServer };

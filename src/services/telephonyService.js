/**
 * Codevirus Security — AI Voice Telephony (Vapi) Service
 */

const fetch = require('node-fetch');
const store = require('../db/localStore');
const supabase = require('../db/supabase');
const {
  VAPI_PRIVATE_KEY,
  VAPI_WEBHOOK_SECRET,
  INDIA_PHONE_NUMBER,
  getConfig
} = require('../config');
const { searchKnowledgeBase } = require('./knowledgeService');
const { findSlotConflict, getTodayIST } = require('./appointmentService');
const { dispatchMetaWhatsApp } = require('./messagingService');

// Tool Call Idempotency Store
const processedToolCalls = new Map();
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of processedToolCalls.entries()) {
    if (now - v.timestamp > 15 * 60 * 1000) processedToolCalls.delete(k);
  }
}, 5 * 60 * 1000);

function verifyWebhookSecret(req) {
  if (!VAPI_WEBHOOK_SECRET) return true;
  const provided =
    req.headers['x-vapi-secret'] ||
    req.headers['x-webhook-secret'] ||
    req.query.secret;
  return provided === VAPI_WEBHOOK_SECRET;
}

async function refreshAssistantDate() {
  const config = getConfig();
  if (!config.assistantId || !VAPI_PRIVATE_KEY) return;
  try {
    const todayIST = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
    const todayFull = new Date().toLocaleDateString('en-US', {
      timeZone: 'Asia/Kolkata',
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const dateHeader = `CURRENT DATE: Today is ${todayFull} (${todayIST}, India Standard Time UTC+5:30). When booking consultations or demo sessions, always call book_appointment with a specific YYYY-MM-DD date — never "tomorrow" or weekday names alone. Convert relative dates using today's date above.\n\n`;

    const getRes = await fetch(`https://api.vapi.ai/assistant/${config.assistantId}`, {
      headers: { Authorization: `Bearer ${VAPI_PRIVATE_KEY}` }
    });
    if (!getRes.ok) throw new Error(`GET assistant failed: ${getRes.status}`);
    const assistant = await getRes.json();

    const messages = (assistant?.model?.messages || []).map((m) => {
      if (m.role !== 'system') return m;
      const cleaned = m.content.replace(/^CURRENT DATE:[^\n]*\n\n/m, '');
      return { ...m, content: dateHeader + cleaned };
    });

    const patchRes = await fetch(`https://api.vapi.ai/assistant/${config.assistantId}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${VAPI_PRIVATE_KEY}`,
        'Content-Type': 'application/json'
      },
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

async function handleVapiWebhook(body) {
  const msg = body?.message;
  let fnName = null;
  let fnArgs = {};
  let toolCallId = null;

  if (msg?.type === 'tool-calls' && (msg.toolCallList?.length || msg.toolCalls?.length)) {
    const tc = (msg.toolCallList || msg.toolCalls)[0];
    fnName = tc.function?.name;
    toolCallId = tc.id;
    const rawArgs = tc.function?.arguments;
    try {
      fnArgs = typeof rawArgs === 'string' ? JSON.parse(rawArgs || '{}') : rawArgs || {};
    } catch {
      fnArgs = {};
    }
  } else if (msg?.type === 'function-call' && msg.functionCall) {
    fnName = msg.functionCall.name;
    fnArgs = msg.functionCall.parameters || {};
  } else if (msg?.type === 'end-of-call-report' || body?.type === 'end-of-call-report') {
    const report = msg || body;
    const summary =
      report.analysis?.summary ||
      report.summary ||
      report.transcript ||
      'Inbound call session completed';
    const phone =
      report.customer?.number || report.call?.customer?.number || 'Web Caller';

    store.addActivity({
      type: 'call_completed',
      title: 'Call Session Completed',
      detail: `${phone} — ${summary.substring(0, 65)}...`,
      tone: 'green'
    });

    if (supabase) {
      try {
        await supabase.from('call_logs').insert([
          {
            call_id: report.call?.id || report.id,
            assistant_id: report.assistantId,
            customer_number: phone,
            duration_seconds: report.durationSeconds || 0,
            summary,
            transcript: report.transcript || null,
            cost: report.cost || 0
          }
        ]);
      } catch {
        // Safe non-blocking insert
      }
    }

    return { response: { received: true } };
  } else {
    return { response: { received: true } };
  }

  // Idempotency Guard
  if (toolCallId && processedToolCalls.has(toolCallId)) {
    console.log(`[webhook] ⚡ Idempotency cache hit for toolCallId "${toolCallId}"`);
    return { response: processedToolCalls.get(toolCallId) };
  }

  // Handler: book_appointment
  if (fnName === 'book_appointment') {
    const { patient_name, phone, service, appointment_date, appointment_time, notes } = fnArgs;

    if (!patient_name || !service) {
      return {
        response: {
          results: [{ toolCallId, result: 'Missing required fields: patient_name and service' }]
        }
      };
    }

    const today = getTodayIST();
    const bookingDate = appointment_date || today;

    // Double-booking check
    const conflict = await findSlotConflict(bookingDate, appointment_time);
    if (conflict.taken) {
      const slotTakenResult = {
        results: [
          {
            toolCallId,
            result: JSON.stringify({
              status: 'slot_taken',
              next_available: conflict.nextAvailable
            })
          }
        ]
      };
      if (toolCallId) processedToolCalls.set(toolCallId, slotTakenResult);
      return { response: slotTakenResult };
    }

    const insertPayload = {
      patient_name,
      phone: phone || null,
      service,
      appointment_date: bookingDate,
      appointment_time: appointment_time || 'TBD',
      status: 'confirmed',
      source: 'sarah',
      notes: notes || null
    };

    const localSaved = store.addAppointment(insertPayload);
    console.log('[webhook] ✓ Codevirus consultation saved locally:', localSaved.id);

    if (supabase) {
      try {
        await supabase.from('appointments').insert([insertPayload]);
      } catch (e) {
        console.warn('[webhook] Supabase sync skipped:', e.message);
      }
    }

    // Auto-dispatch WhatsApp Confirmation & Google Maps Link
    const cleanPhone = (phone || '').replace(/[^\d+]/g, '');
    if (cleanPhone) {
      const confirmText = `Greetings ${patient_name}! Your consultation at Codevirus Academy has been confirmed for ${bookingDate} at ${appointment_time || 'scheduled time'}.\n📍 Venue: House No. A-76, Kapoorthala, Aliganj, Lucknow (Near Chandganj Garden / IT Crossing).\n🗺️ Maps: https://maps.google.com/?q=Codevirus+Security+Lucknow\nCounselor Helpline: ${INDIA_PHONE_NUMBER}`;
      store.addMessage({
        chat_id: cleanPhone.startsWith('+') ? cleanPhone : `+${cleanPhone}`,
        sender: 'business',
        text: confirmText,
        is_lead: false
      });
      store.addActivity({
        type: 'whatsapp_confirmed',
        title: 'WhatsApp Confirmation Sent',
        detail: `${cleanPhone} — Booking confirmed for ${bookingDate} (${service})`,
        tone: 'green'
      });
      await dispatchMetaWhatsApp(cleanPhone, confirmText);
    }

    const bookingResult = {
      results: [
        {
          toolCallId,
          result: `Confirmed for ${patient_name} — ${service} on ${bookingDate} at ${appointment_time} with Codevirus Security. A WhatsApp confirmation has been dispatched.`
        }
      ]
    };

    if (toolCallId) processedToolCalls.set(toolCallId, bookingResult);
    return { response: bookingResult };
  }

  // Handler: transfer_call
  if (fnName === 'transfer_call') {
    const { caller_name, destination, reason } = fnArgs;
    const destNumber = destination || INDIA_PHONE_NUMBER;
    store.addActivity({
      type: 'call_transferred',
      title: 'Call Transferred to Counselor',
      detail: `${caller_name || 'Caller'} transferred to ${destNumber} — Reason: ${reason || 'Human Request'}`,
      tone: 'blue'
    });
    const transferResult = {
      results: [
        {
          toolCallId,
          result: JSON.stringify({
            status: 'transfer_initiated',
            forward_to: destNumber,
            message: 'Transferring caller to senior coordinator now.'
          })
        }
      ]
    };
    if (toolCallId) processedToolCalls.set(toolCallId, transferResult);
    return { response: transferResult };
  }

  // Handler: search_knowledge
  if (fnName === 'search_knowledge') {
    const { query } = fnArgs;
    const searchRes = searchKnowledgeBase(query);
    const kbResult = {
      results: [
        {
          toolCallId,
          result: JSON.stringify(searchRes)
        }
      ]
    };
    if (toolCallId) processedToolCalls.set(toolCallId, kbResult);
    return { response: kbResult };
  }

  return {
    response: {
      results: [{ toolCallId, result: 'Function not implemented on server.' }]
    }
  };
}

async function triggerOutboundCall(phone, patient_name, call_type) {
  const config = getConfig();
  if (!config.assistantId || !config.phoneNumberId) {
    throw new Error('assistantId or phoneNumberId not configured in config.json');
  }

  const firstMessages = {
    no_show: `Hi ${patient_name}, this is Sarah calling from Codevirus Security in Lucknow. We noticed we missed you for your scheduled session today — completely understandable, things come up! Would you like me to reschedule your consultation or demo slot for another time that suits you better?`,
    follow_up: `Hi ${patient_name}, this is Sarah from Codevirus Security. I'm just calling to follow up after your recent consultation with our security team — how did everything go, and do you have any questions about the curriculum or security audit scope we discussed?`,
    reactivation: `Hi ${patient_name}, this is Sarah calling from Codevirus Security. You had reached out to us earlier regarding our cybersecurity programs and security services, so I wanted to check in — are you still looking to get started? We have new practical lab batches and audit slots open this week.`
  };

  const firstMessage = firstMessages[call_type] || firstMessages.follow_up;

  const payload = {
    assistantId: config.assistantId,
    phoneNumberId: config.phoneNumberId,
    customer: { number: phone, name: patient_name },
    assistantOverrides: {
      firstMessage,
      firstMessageMode: 'assistant-speaks-first'
    }
  };

  const vapiRes = await fetch('https://api.vapi.ai/call/phone', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${VAPI_PRIVATE_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  const data = await vapiRes.json();
  if (!vapiRes.ok) {
    throw new Error(data?.message || 'Vapi call dispatch failed');
  }

  return data;
}

module.exports = {
  verifyWebhookSecret,
  refreshAssistantDate,
  handleVapiWebhook,
  triggerOutboundCall
};

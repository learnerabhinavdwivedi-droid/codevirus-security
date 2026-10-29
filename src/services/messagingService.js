/**
 * Codevirus Security — Messaging & WhatsApp Operations Service
 */

const fetch = require('node-fetch');
const store = require('../db/localStore');
const supabase = require('../db/supabase');
const { OPENAI_API_KEY, INDIA_PHONE_NUMBER } = require('../config');
const { searchKnowledgeBase } = require('./knowledgeService');
const { LEAD_EXTRACTION_PROMPT } = require('../config/constants');

function escapeXml(unsafe) {
  return String(unsafe || '').replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case "'": return '&apos;';
      case '"': return '&quot;';
      default:  return c;
    }
  });
}

async function generateSarahReply(userMessage, history = []) {
  const kbMatch = searchKnowledgeBase(userMessage);
  const kbContext =
    kbMatch.status === 'found'
      ? `\nVERIFIED KNOWLEDGE BASE CONTEXT (${kbMatch.source}):\n${kbMatch.summary}\n`
      : '';

  const systemPrompt = `You are Sarah, the AI coordinator and admissions counselor at Codevirus Security Pvt. Ltd. & Codevirus Academy located at Kapoorthala, Aliganj, Lucknow, UP, India.
Leadership: Ankit Rai (Director/VAPT), Pawan Yadav (Bug Bounty), Abhishek Pal (SOC/SIEM).
Campus Address: House No. A-76, Near Chandganj Garden Road, Kapoorthala, Aliganj, Lucknow (Ph: ${INDIA_PHONE_NUMBER}).
Working hours: Mon-Sat 10 AM-8 PM, Sun 10 AM-4 PM IST.
${kbContext}
Guidelines:
- If caller/user writes in Hindi or Hinglish, reply in natural, polite Hinglish. If in English, reply in friendly English.
- Keep responses short and conversational (1 to 3 short sentences maximum).
- Transparently acknowledge you are Sarah, the AI coordinator for Codevirus.
- Never invent specific course fee numbers or unverified placement salaries. Invite them to a free 1-on-1 counseling demo at the Kapoorthala campus where counselors explain batch options and scholarships.`;

  if (OPENAI_API_KEY && !OPENAI_API_KEY.includes('your_openai_key')) {
    try {
      const messages = [{ role: 'system', content: systemPrompt }];
      if (Array.isArray(history) && history.length > 0) {
        history.slice(-4).forEach((h) => {
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
          Authorization: `Bearer ${OPENAI_API_KEY}`,
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

async function dispatchMetaWhatsApp(toPhone, messageText) {
  if (!process.env.WHATSAPP_TOKEN || !process.env.WHATSAPP_PHONE_NUMBER_ID) return;
  try {
    const cleanPhone = toPhone.replace(/[^\d]/g, '');
    await fetch(`https://graph.facebook.com/v18.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: cleanPhone,
        text: { body: messageText }
      })
    });
  } catch (err) {
    console.warn('[messaging] Meta Graph API dispatch notice:', err.message);
  }
}

async function extractLeadFields(text) {
  if (!OPENAI_API_KEY || OPENAI_API_KEY.includes('your_openai_key')) return null;
  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        temperature: 0,
        messages: [
          { role: 'system', content: LEAD_EXTRACTION_PROMPT },
          { role: 'user', content: text }
        ]
      })
    });
    if (!res.ok) return null;
    const data = await res.json();
    const raw = (data?.choices?.[0]?.message?.content || '')
      .trim()
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/```\s*$/, '')
      .trim();
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

module.exports = {
  escapeXml,
  generateSarahReply,
  dispatchMetaWhatsApp,
  extractLeadFields
};

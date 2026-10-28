/**
 * Codevirus Security — AI Calling Agent Setup
 * Configures the Vapi Assistant ("Sarah — Codevirus Security") and seeds Supabase demo data.
 * Usage: node setup.js
 */

require('dotenv').config();
const fetch = require('node-fetch');
const { createClient } = require('@supabase/supabase-js');
const fs   = require('fs');
const path = require('path');

const CONFIG_PATH          = path.join(__dirname, 'config.json');
const VAPI_PRIVATE_KEY     = process.env.VAPI_PRIVATE_KEY || '';
const VAPI_PUBLIC_KEY      = process.env.VAPI_PUBLIC_KEY  || '';
const SUPABASE_URL         = process.env.SUPABASE_URL     || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE || '';
const INDIA_PHONE_NUMBER   = process.env.INDIA_PHONE_NUMBER || process.env.TWILIO_NUMBER || '+919648777706';
const TWILIO_NUMBER        = INDIA_PHONE_NUMBER;

// ── Codevirus Security AI Counsellor & Receptionist Prompt ──────────────────
const SYSTEM_PROMPT = `You are Sarah, the AI voice coordinator and virtual receptionist for Codevirus Security Private Limited and Codevirus Academy in Lucknow, Uttar Pradesh, India.

IDENTITY & COMPLIANCE DISCLOSURE:
You are an AI-powered voice coordinator. You are open, transparent, and proud to represent Codevirus Security.
- If anyone asks if you are an AI or robot, reply naturally: "Yes, I am Sarah, Codevirus's AI voice coordinator! I can answer questions about our cybersecurity courses, syllabus, and enterprise VAPT audits, or connect you directly with our senior counseling team at Kapoorthala."
- Always speak with professional warmth, clarity, and respect.

THINGS YOU NEVER SAY / HALLUCINATION GUARDRAILS:
- Never invent specific course fee amounts, secret discounts, or unverified salary guarantees. Fees depend on the module (foundation, 6-month specialist, or 1-year diploma), so always invite the caller to a free counseling demo session where counselors provide the official fee breakdown.
- Never guarantee specific hacking outcomes on third-party targets or offer personal account recovery (WhatsApp/Instagram/Facebook).
- Never claim "100% placement" without clarifying that Codevirus provides dedicated placement guidance, technical interview preparation, and direct internship opportunities.

COMPANY & ACADEMY INFORMATION — CODEVIRUS SECURITY:
- Company Name: Codevirus Security Private Limited (Codevirus Academy)
- Tagline: "Leading Cybersecurity Excellence — Building Industry-Ready Cybersecurity Professionals & Securing Digital Ecosystems"
- Campus Address: House No. A-76 / 545C/115F, Near Chandganj Garden Road, Kapoorthala, Aliganj, Lucknow, Uttar Pradesh – 226024, India
- Phone / Career Helpline: +91 96487-77706 / +91 89049-37164
- Websites: codevirussec.in | codevirussec.academy
- Mode of Delivery: Both Offline in-person labs at Kapoorthala Lucknow & Live Online Interactive Batches
- Working Hours: Monday to Saturday: 10:00 AM – 8:00 PM IST; Sunday: 10:00 AM – 4:00 PM IST.

LEADERSHIP & TEAM ROUTING:
- Ankit Rai (Founder & Director) — Enterprise Network Security, SOC Architecture, ISO 27001 Compliance, Enterprise VAPT Scoping
- Pawan Yadav (Security Analyst) — Bug Bounty, Web Application Pentesting, Burp Suite, VAPT Labs
- Abhishek Pal (Cybersecurity Engineer) — Network Security, SIEM, SOC Monitoring & Incident Response
- Abhishek Pandey (MERN Stack Developer) — Secure Full-Stack Web & Application Development

HUMAN HANDOFF & ESCALATION RULES:
Call the transfer_call tool immediately if:
1. Caller explicitly requests to speak with a human counselor, director, or Ankit sir.
2. Caller is upset, frustrated, or has a complaint or refund query.
3. Active cybersecurity incident or urgent breach response reported by an enterprise.
4. Complex enterprise VAPT scoping requiring custom legal agreements.
5. If after working hours, offer to record a priority message with their name, number, and inquiry.

MULTILINGUAL CAPABILITY (ENGLISH, HINDI & HINGLISH):
- Lucknow callers frequently speak Hinglish (e.g., "Mujhe SOC course ki fees aur timings pata karni hai", "Offline classes Kapoorthala mein kab se start ho rahi hain?").
- Seamlessly mirror the caller's language. If they speak Hindi, respond in polite, clear Hindi. If they speak Hinglish, respond in natural, friendly Hinglish. If English, respond in professional Indian English.
- Avoid repetitive or artificial filler sounds ("Mmmm..."). Keep pauses crisp and natural so audio remains clear over 2G/4G/5G mobile networks.

KNOWLEDGE BASE & VERIFIED ANSWERS:
- Call search_knowledge if the caller asks for specific syllabus topics, batch timings, prerequisites, or campus landmarks.

════════ HOW TO BE SARAH ════════
1. The caller is the candidate or client. Ask for their name directly.
2. Short turns: Ask one question at a time. This is a real-time phone call.
3. Checking & Booking Flow:
   - Step 1: Confirm candidate's name and contact number.
   - Step 2: Determine interest (SOC Analyst, Ethical Hacking / Bug Bounty, VAPT Audit, Cloud/CCNA).
   - Step 3: Ask for preferred day and time (Monday–Saturday 10 AM to 8 PM, Sunday 10 AM to 4 PM).
   - Step 4: Confirm slot with book_appointment (exact YYYY-MM-DD date and time).
   - Step 5: Inform them that a WhatsApp confirmation with the campus location and map will be sent immediately.`;

function buildAssistantPayload(webhookUrl) {
  const todayIST = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
  const todayFull = new Date().toLocaleDateString('en-US', {
    timeZone: 'Asia/Kolkata', weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
  const dateHeader = `CURRENT DATE: Today is ${todayFull} (${todayIST}, India Standard Time UTC+5:30). When booking consultations or demo sessions, always call book_appointment with a specific YYYY-MM-DD date — never "tomorrow" or weekday names alone. Convert relative dates using today's date above.\n\n`;

  return {
    name: 'Sarah - Codevirus Security',
    firstMessage: "Hello! Welcome to Codevirus Security and Academy, Lucknow. I am Sarah, your AI coordinator. This call may be recorded for quality and security verification. How can I help you with our cybersecurity training programs or enterprise security services today?",
    transcriber: {
      provider: 'deepgram',
      model: 'nova-2',
      language: 'multi',
      confidenceThreshold: 0.5,
      keyterm: [
        'Codevirus', 'Codevirus Security', 'Codevirus Academy', 'Ankit Rai', 'Pawan Yadav', 'Abhishek Pal',
        'Kapoorthala', 'Lucknow', 'Aliganj', 'Chandganj', 'VAPT', 'SOC', 'SOC Analyst', 'SIEM', 'Splunk', 'Wazuh',
        'Ethical Hacking', 'Bug Bounty', 'Burp Suite', 'Pentesting', 'Penetration Testing', 'ISO 27001', 'CCNA',
        'Cloud Security', 'Cybersecurity', 'Internship', 'Diploma', 'Demo', 'Consultation', 'Hinglish',
        'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
      ]
    },
    model: {
      provider: 'openai',
      model: 'gpt-4o-mini',
      temperature: 0.7,
      messages: [{ role: 'system', content: dateHeader + SYSTEM_PROMPT }],
      tools: [
        {
          type: 'function',
          function: {
            name: 'book_appointment',
            description: 'Book a free consultation, lab demo class, or security scoping session at Codevirus Security / Academy.',
            parameters: {
              type: 'object',
              properties: {
                patient_name:     { type: 'string', description: 'Full name of the student or client' },
                phone:            { type: 'string', description: 'Caller phone number' },
                service:          { type: 'string', description: 'Course, demo, internship, or cybersecurity service requested' },
                appointment_date: { type: 'string', description: 'Date of the appointment in YYYY-MM-DD format' },
                appointment_time: { type: 'string', description: 'Time of the appointment (e.g. 11:00 AM or 14:30)' },
                notes:            { type: 'string', description: 'Any additional context or background' }
              },
              required: ['patient_name', 'service', 'appointment_date', 'appointment_time']
            }
          },
          server: { url: webhookUrl || 'http://localhost:3000/webhook' }
        },
        {
          type: 'function',
          function: {
            name: 'transfer_call',
            description: 'Warm transfer the call to a human counselor, director (Ankit Rai), or emergency hotline.',
            parameters: {
              type: 'object',
              properties: {
                caller_name: { type: 'string', description: 'Name of the caller' },
                destination: { type: 'string', description: 'Phone number to transfer to (default: +919648777706)' },
                reason:      { type: 'string', description: 'Reason for handoff: human_requested, enterprise_scoping, complaint, or incident_response' }
              },
              required: ['reason']
            }
          },
          server: { url: webhookUrl || 'http://localhost:3000/webhook' }
        },
        {
          type: 'function',
          function: {
            name: 'search_knowledge',
            description: 'Search Codevirus verified knowledge base for syllabus details, course durations, tools covered, or campus directions.',
            parameters: {
              type: 'object',
              properties: {
                query: { type: 'string', description: 'Keywords or search topic (e.g. SOC Analyst syllabus, Burp Suite, Kapoorthala directions)' }
              },
              required: ['query']
            }
          },
          server: { url: webhookUrl || 'http://localhost:3000/webhook' }
        }
      ]
    },
    voice: {
      provider: '11labs',
      voiceId: 'aCChyB4P5WEomwRsOKRh',
      stability: 0.35,
      similarityBoost: 0.75,
      style: 0.4,
      useSpeakerBoost: true,
      model: 'eleven_multilingual_v2'
    },
    backgroundSound: 'office',
    startSpeakingPlan: { waitSeconds: 0.3 },
    stopSpeakingPlan: { numWords: 1, voiceSeconds: 0.25, backoffSeconds: 1.0 },
    endCallPhrases: ['goodbye', 'thank you bye', 'have a good day', 'see you soon'],
    hooks: [
      {
        do: [{ type: 'say', exact: 'Hello? Are you still on the line?' }],
        on: 'customer.speech.timeout',
        options: { timeoutSeconds: 12, triggerMaxCount: 3, triggerResetMode: 'onUserSpeech' }
      },
      {
        do: [
          { type: 'say', exact: "Thank you for calling Codevirus Security. Feel free to call us back or message us on WhatsApp at +91 96487-77706. Have a great day!" },
          { tool: { type: 'endCall' }, type: 'tool' }
        ],
        on: 'customer.speech.timeout',
        options: { timeoutSeconds: 25, triggerMaxCount: 3, triggerResetMode: 'onUserSpeech' }
      }
    ]
  };
}

async function vapiRequest(endpoint, method = 'GET', body = null) {
  const opts = {
    method,
    headers: {
      'Authorization': `Bearer ${VAPI_PRIVATE_KEY}`,
      'Content-Type': 'application/json'
    }
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`https://api.vapi.ai${endpoint}`, opts);
  const json = await res.json();
  if (!res.ok) throw new Error(`Vapi ${method} ${endpoint} → ${res.status}: ${JSON.stringify(json)}`);
  return json;
}

async function main() {
  console.log('\n╔══════════════════════════════════════════════════════╗');
  console.log('║  Codevirus Security — AI Agent Setup & Rebranding    ║');
  console.log('╚══════════════════════════════════════════════════════╝\n');

  let savedConfig = {};
  if (fs.existsSync(CONFIG_PATH)) {
    try { savedConfig = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8')); } catch {}
  }

  const webhookUrl = savedConfig.webhookUrl || 'http://localhost:3000/webhook';
  const payload = buildAssistantPayload(webhookUrl);

  let assistantId = savedConfig.assistantId || null;
  if (assistantId) {
    console.log(`▶ Updating existing Vapi assistant (${assistantId}) to Codevirus Security…`);
    try {
      await vapiRequest(`/assistant/${assistantId}`, 'PATCH', payload);
      console.log(`  ✓ Assistant patched with Codevirus Security prompt & tools`);
    } catch (err) {
      console.log(`  ⚠ Could not patch existing assistant (${err.message}). Creating new one…`);
      const assistant = await vapiRequest('/assistant', 'POST', payload);
      assistantId = assistant.id;
      console.log(`  ✓ New Assistant created → ID: ${assistantId}`);
    }
  } else {
    console.log('▶ Creating Vapi assistant (Sarah - Codevirus Security)…');
    const assistant = await vapiRequest('/assistant', 'POST', payload);
    assistantId = assistant.id;
    console.log(`  ✓ Assistant created → ID: ${assistantId}`);
  }

  let phoneNumberId = savedConfig.phoneNumberId || null;
  if (!phoneNumberId) {
    try {
      const phones = await vapiRequest('/phone-number');
      const match = Array.isArray(phones) && phones.find(p =>
        p.number === TWILIO_NUMBER || p.number === TWILIO_NUMBER.replace('+', '')
      );
      if (match) phoneNumberId = match.id;
    } catch (err) {
      console.log('  ⚠ Could not fetch phone numbers:', err.message);
    }
  }

  // Preserve Public Key for Web SDK (`vapiKey`) while keeping Private Key on server
  const config = {
    ...savedConfig,
    assistantId,
    phoneNumberId,
    vapiKey:       savedConfig.vapiPublicKey || VAPI_PUBLIC_KEY,
    vapiPublicKey: savedConfig.vapiPublicKey || VAPI_PUBLIC_KEY,
    supabaseUrl:   SUPABASE_URL,
    webhookUrl
  };
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
  console.log('  ✓ Config saved to config.json (Public Web Key preserved)');

  // Seed Supabase Demo Data
  console.log('\n▶ Seeding Supabase with Codevirus Security data…');
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });

  await supabase.from('appointments').delete().eq('appointment_date', today);
  const { error: apptErr } = await supabase.from('appointments').insert([
    { patient_name: 'Aarav Sharma',    phone: '+919667172535', service: 'SOC Analyst Career Counseling', appointment_date: today, appointment_time: '10:00 AM', status: 'completed', source: 'sarah',      notes: 'Interested in placement guarantee & SIEM labs' },
    { patient_name: 'Priya Tiwari',    phone: '+919667172535', service: 'VAPT & Network Security Audit', appointment_date: today, appointment_time: '2:00 PM',  status: 'confirmed', source: 'sarah',      notes: 'Enterprise web app pentesting scope' },
    { patient_name: 'Siddharth Dubey', phone: '+919839012345', service: 'Ethical Hacking & Bug Bounty',  appointment_date: today, appointment_time: '4:30 PM',  status: 'confirmed', source: 'front-desk', notes: 'Kapoorthala offline batch inquiry' }
  ]);
  if (apptErr) console.log('  ⚠ Appointments seed warning:', apptErr.message);
  else console.log('  ✓ Codevirus consultations seeded (3 rows)');

  await supabase.from('dormant_patients').delete().not('id', 'is', null);
  const { error: dormErr } = await supabase.from('dormant_patients').insert([
    { name: 'Vikram Pratap Singh', phone: '+919876543210', last_visit: '2025-11-15', service_history: 'Enterprise VAPT & ISO 27001 Inquiry', reactivation_status: 'pending' },
    { name: 'Neha Verma',          phone: '+919812345678', last_visit: '2025-10-20', service_history: 'SOC Analyst & SIEM Training Demo',    reactivation_status: 'pending' },
    { name: 'Rohan Malhotra',      phone: '+919711223344', last_visit: '2025-12-01', service_history: 'Cloud Security (AWS) Diploma Inquiry', reactivation_status: 'pending' }
  ]);
  if (dormErr) console.log('  ⚠ Dormant leads seed warning:', dormErr.message);
  else console.log('  ✓ Dormant leads seeded (3 rows)');

  console.log('\n✓ Setup Complete! Run `node server.js` and open http://localhost:3000/dashboard.html\n');
}

main().catch(err => {
  console.error('\n✗ Setup failed:', err.message);
  process.exit(1);
});

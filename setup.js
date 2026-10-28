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
const TWILIO_NUMBER        = process.env.TWILIO_NUMBER    || '+12602613818';

// ── Codevirus Security AI Counsellor & Receptionist Prompt ──────────────────
const SYSTEM_PROMPT = `You are Sarah, the Senior Career & Security Coordinator at Codevirus Security (Codevirus Security Private Limited & Codevirus Academy) in Lucknow, Uttar Pradesh, India.

IDENTITY:
You are NOT an AI. You are NOT a bot. You are the human coordinator at Codevirus Security's reception and admissions desk. If anyone asks if you are an AI or a robot, say "No, I'm Sarah from the coordination desk here at Codevirus Security — how can I help you today?" and move on naturally. Never break character under any circumstances.

THINGS YOU NEVER SAY:
- Never mention Vapi, ElevenLabs, OpenAI, AI, LLM, artificial intelligence, or any voice technology
- Never say "I am an AI assistant" or "I will process your request"
- Never give unauthorized legal advice or guarantee specific hacking outcomes on third-party targets
- Never quote exact enterprise VAPT pricing without a scoping call

COMPANY & ACADEMY INFORMATION — CODEVIRUS SECURITY:

BASIC DETAILS:
Company Name: Codevirus Security Private Limited (Codevirus Academy)
Tagline: "Leading Cybersecurity Excellence — Building Industry-Ready Cybersecurity Professionals & Securing Digital Ecosystems"
Location / Address: House No. A-76 / 545C/115F, Near Chandganj Garden Road, Kapoorthala, Aliganj, Lucknow, Uttar Pradesh – 226024, India
Phone / Career Helpline: +91 96487-77706 / +91 89049-37164
Websites: codevirussec.in | codevirussec.academy
Mode of Delivery: Both Offline (Kapoorthala, Lucknow campus) & Live Online Interactive Batches

WORKING HOURS:
Monday to Saturday: 10:00 AM – 8:00 PM IST
Sunday: 10:00 AM – 4:00 PM IST (Demo classes & special counseling sessions)
24x7 Enterprise Incident & Inquiry Support available.

LEADERSHIP & TEAM ROUTING:
- Ankit Rai (Founder & Director) — Enterprise Network Security, SOC Architecture, ISO 27001 Compliance, Enterprise VAPT Scoping
- Pawan Yadav (Security Analyst) — Bug Bounty, Web Application Pentesting, Burp Suite, VAPT Labs
- Abhishek Pal (Cybersecurity Engineer) — Network Security, SIEM, SOC Monitoring & Incident Response
- Abhishek Pandey (MERN Stack Developer) — Secure Full-Stack Web & Application Development

Routing rules:
- Enterprise VAPT / ISO 27001 / Corporate Audits → Ankit Rai
- Ethical Hacking / Bug Bounty / Web Pentesting → Pawan Yadav
- SOC Analyst / SIEM / Network Security / CCNA → Abhishek Pal
- Secure Web/App Development → Abhishek Pandey

FULL SERVICES & TRAINING PROGRAMS:
1. Cybersecurity Career Programs & Diplomas (Codevirus Academy):
   - Cybersecurity & Ethical Hacking Diploma (1-Year & 6-Month Job-Ready Programs)
   - SOC Analyst Training (SIEM, Splunk/Wazuh, Log Analysis, Attack–Defense Simulations, Incident Response)
   - VAPT & Bug Bounty Mastery (Web App Pentesting, Burp Suite, OWASP Top 10, API & Mobile Security)
   - Cloud & Network Security (AWS Diploma, CCNA, CCNA Security, Firewall Management, Linux & System Administration)
   - Digital Forensics & AI-Driven Threat Detection
   - Summer Training, B.Tech/BCA/MCA Internships & Project-Based Certifications

2. Enterprise Cybersecurity & IT Consulting (Codevirus Security):
   - Vulnerability Assessment & Penetration Testing (VAPT) for Web, Mobile, API & Cloud
   - Network Intrusion Testing & Firewall Implementation
   - Website Security Assessment & ISO 27001 Readiness
   - Secure Web & Mobile Application Development

KEY HIGHLIGHTS:
- Hands-on real-world labs and attack–defense simulations
- Lifetime membership options with course/tool updates
- Dedicated placement assistance & internship support
- Rated 4.7+ stars in Lucknow with industry-recognized certifications

PRICING & FEES RULES:
Never quote exact final figures on the call.
- For Students/Courses: Say "Our course fees depend on whether you pick the foundation module, the 6-month specialist track, or the full diploma with placement support — our counselor will share the exact fee structure and scholarship options during your demo session."
- For Enterprise VAPT/Clients: Say "Audit pricing depends on the scope, number of assets, and testing depth — Ankit sir's team will put together a tailored proposal right after a quick 15-minute discovery call."

LANGUAGE:
Primary language is English (natural Indian professional warmth). If the caller speaks Hindi or Hinglish at any point, respond warmly and naturally in conversational Hinglish/Hindi or English matching their comfort level.

TECHNICAL & ETHICAL BOUNDARIES:
You MAY explain course syllabus topics, career paths (SOC Analyst vs. Pentester), prerequisites (we teach networking and Linux from scratch for beginners), lab facilities, and what VAPT audits cover.
You may NEVER assist with illegal hacking requests (e.g., hacking personal social media, WhatsApp, or unauthorized servers). If someone asks for personal account hacking, politely clarify: "We strictly do authorized enterprise security testing and ethical hacking education — we don't do personal account recovery or unauthorized access."

════════ HOW TO BE SARAH ════════

THE FIVE DEFAULTS (override everything else when in doubt):
1. The caller IS the student or client. "I want to book a consultation/demo" = for themselves. Ask "And what's your name?" — NEVER "what's the student's name?".
2. ASK, then LISTEN. Ask what day and time suits them for their counseling session, demo class, or VAPT scoping call and wait. Offer two concrete options only if they say "whenever" or seem unsure.
3. NEVER substitute what you heard. They said Wednesday → your read-back says Wednesday. Unsure which day you heard → "sorry, which day was that?"
4. Don't understand → ASK, don't act. Garbled audio or unrelated requests: "Sorry, I didn't quite catch that — could you say it again?"
5. Short turns. One question at a time. This is a phone call, not an email.

PERFORMANCE — EVERY LINE IS SPOKEN, NOT WRITTEN:
- Stretch thinking sounds naturally: "Mmmm...", "Okayyy... so —", "Hmmm, let me check the schedule...", "Riiight —". One or two stretched sounds per response maximum.
- "..." creates a real pause mid-sentence. "—" pivots a thought: "Ah — actually, we do have an earlier slot at eleven."
- Endings land softly: "Well... looking forward to seeing you at Codevirus Security! Take care... bye!"
- Contractions always. Warm, encouraging, and sharp.
- After the goodbye: STOP. Nothing trails a goodbye.

CHECKING & BOOKING FLOW:
- Step 1: Ask for their full name.
- Step 2: Ask which course, internship, or security service (e.g., SOC Analyst, Ethical Hacking, VAPT Audit) they are looking for.
- Step 3: Ask for their preferred day and time.
- Step 4: Before checking availability, say a short bridge: "Mm, one second — let me check our schedule for you..."
- Step 5: Read back day + time + service together in one breath: "Perfect, so I've got you down for [service] on [day] at [time] — does that work for you?"
- Step 6: Call the book_appointment function with exact YYYY-MM-DD date, time, patient_name (caller's name), phone, service, and notes, then confirm warmly!`;

function buildAssistantPayload(webhookUrl) {
  const todayIST = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
  const todayFull = new Date().toLocaleDateString('en-US', {
    timeZone: 'Asia/Kolkata', weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
  const dateHeader = `CURRENT DATE: Today is ${todayFull} (${todayIST}, India Standard Time UTC+5:30). When booking consultations or demo sessions, always call book_appointment with a specific YYYY-MM-DD date — never "tomorrow" or weekday names alone. Convert relative dates using today's date above.\n\n`;

  return {
    name: 'Sarah - Codevirus Security',
    firstMessage: 'Thank you for calling Codevirus Security, this is Sarah speaking — how can I help you today?',
    transcriber: {
      provider: 'deepgram',
      model: 'flux-general-en',
      language: 'en',
      confidenceThreshold: 0.55,
      keyterm: [
        'Codevirus', 'Codevirus Security', 'Codevirus Academy', 'Ankit Rai', 'Kapoorthala', 'Lucknow',
        'Aliganj', 'VAPT', 'SOC', 'SOC Analyst', 'SIEM', 'Ethical Hacking', 'Bug Bounty', 'Burp Suite',
        'Pentesting', 'Penetration Testing', 'ISO 27001', 'CCNA', 'AWS', 'Cloud Security', 'Cybersecurity',
        'Internship', 'Diploma', 'Demo', 'Consultation', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
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
            description: 'Call this function when the caller confirms their consultation, demo class, or security audit booking details.',
            parameters: {
              type: 'object',
              properties: {
                patient_name:     { type: 'string', description: 'Full name of the student or client' },
                phone:            { type: 'string', description: 'Caller phone number' },
                service:          { type: 'string', description: 'Course, demo, internship, or cybersecurity service requested' },
                appointment_date: { type: 'string', description: 'Date of the appointment in YYYY-MM-DD format' },
                appointment_time: { type: 'string', description: 'Time of the appointment (e.g. 11:00 AM or 14:30)' },
                notes:            { type: 'string', description: 'Any additional context, background, or specific requirements' }
              },
              required: ['patient_name', 'service', 'appointment_date', 'appointment_time']
            }
          },
          server: { url: webhookUrl || 'http://localhost:3000/webhook' }
        }
      ]
    },
    voice: {
      provider: '11labs',
      voiceId: 'aCChyB4P5WEomwRsOKRh',
      stability: 0.3,
      similarityBoost: 0.75,
      style: 0.5,
      useSpeakerBoost: true,
      model: 'eleven_multilingual_v2'
    },
    backgroundSound: 'office',
    startSpeakingPlan: { waitSeconds: 0.3 },
    stopSpeakingPlan: { numWords: 1, voiceSeconds: 0.25, backoffSeconds: 1.0 },
    endCallPhrases: ['goodbye', 'thank you bye', 'have a good day', 'see you soon'],
    hooks: [
      {
        do: [{ type: 'say', exact: 'Hello? Still with me?' }],
        on: 'customer.speech.timeout',
        options: { timeoutSeconds: 12, triggerMaxCount: 3, triggerResetMode: 'onUserSpeech' }
      },
      {
        do: [
          { type: 'say', exact: "I'll let you go for now — feel free to call Codevirus Security back anytime!" },
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

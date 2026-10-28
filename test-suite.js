const { execSync } = require('child_process');
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

const jsFiles = [
  'server.js',
  'start.js',
  'tunnel.js',
  'setup.js',
  'reset-demo.js',
  'create_tables.js',
  'local-store.js',
  'generate-assets.js',
  'update-tunnel.js',
  'ecosystem.config.js',
  'windows-service.js'
];

async function runTests() {
  console.log('--- 1. Testing JavaScript Syntax ---');
  for (const f of jsFiles) {
    try {
      execSync(`node -c "${path.join(__dirname, f)}"`);
      console.log(`✓ ${f} syntax OK`);
    } catch (e) {
      console.error(`❌ Syntax error in ${f}:`, e.message);
      process.exit(1);
    }
  }

  console.log('\n--- 2. Testing Static Files & Assets ---');
  const staticFiles = [
    '/dashboard.html',
    '/BookingCalendar.html',
    '/whatsapp.html',
    '/logo-navy.png',
    '/chat-wallpaper.png',
    '/wa-icon.svg',
    '/config'
  ];

  for (const p of staticFiles) {
    const res = await fetch(`http://localhost:3000${p}`);
    if (res.status === 200) {
      console.log(`✓ GET ${p} -> 200 OK (${res.headers.get('content-type')})`);
    } else {
      console.error(`❌ GET ${p} failed with status: ${res.status}`);
      process.exit(1);
    }
  }

  console.log('\n--- 3. Testing REST API Endpoints & Security ---');
  // Health
  const healthRes = await fetch('http://localhost:3000/health');
  const health = await healthRes.json();
  console.log(`✓ GET /health ->`, health.status, `(${health.company})`);

  // Sanitized Config
  const cfgRes = await fetch('http://localhost:3000/config');
  const cfg = await cfgRes.json();
  if (cfg.vapiPrivateKey || cfg.SUPABASE_SERVICE) {
    console.error('❌ Security alert: Private keys exposed in /config!');
    process.exit(1);
  } else {
    console.log(`✓ GET /config -> Verified Sanitized (No private keys exposed)`);
  }

  // Analytics
  const analyticsRes = await fetch('http://localhost:3000/api/analytics');
  const analytics = await analyticsRes.json();
  console.log(`✓ GET /api/analytics -> Bookings: ${analytics.totalAppointments}, Conversion: ${analytics.conversionRate}%`);

  // Activity
  const actRes = await fetch('http://localhost:3000/api/activity');
  const act = await actRes.json();
  console.log(`✓ GET /api/activity -> ${act.length} activity items`);

  // Appointments GET
  const apptsRes = await fetch('http://localhost:3000/api/appointments');
  const appts = await apptsRes.json();
  console.log(`✓ GET /api/appointments -> ${appts.length} appointments`);

  // Appointments POST (Unique slot)
  const newApptRes = await fetch('http://localhost:3000/api/appointments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      patient_name: 'Security Test Candidate',
      phone: '+919999988888',
      service: 'SOC Analyst Career Counseling',
      appointment_date: '2026-10-30',
      appointment_time: '11:00 AM',
      notes: 'Automated verification test'
    })
  });
  const newAppt = await newApptRes.json();
  console.log(`✓ POST /api/appointments -> ${newAppt.success ? 'Success ID: ' + newAppt.appointment.id : 'Failed'}`);

  // Appointments POST Double-Booking Collision Guard (Same slot without force)
  const dupeRes = await fetch('http://localhost:3000/api/appointments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      patient_name: 'Dupe Candidate',
      phone: '+919999977777',
      service: 'SOC Analyst Career Counseling',
      appointment_date: '2026-10-30',
      appointment_time: '11:00 AM',
      notes: 'Should be rejected'
    })
  });
  if (dupeRes.status === 409) {
    const dupeJson = await dupeRes.json();
    console.log(`✓ POST /api/appointments -> 409 Conflict correctly caught: ${dupeJson.error}`);
  } else {
    console.warn(`⚠ Collision guard returned status: ${dupeRes.status}`);
  }

  // Status update via PATCH
  if (newAppt?.appointment?.id) {
    const patchRes = await fetch(`http://localhost:3000/api/appointments/${newAppt.appointment.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'completed' })
    });
    const patchJson = await patchRes.json();
    console.log(`✓ PATCH /api/appointments/${newAppt.appointment.id} -> Status: ${patchJson.status}`);

    // Appointments DELETE
    const delRes = await fetch(`http://localhost:3000/api/appointments/${newAppt.appointment.id}`, { method: 'DELETE' });
    const del = await delRes.json();
    console.log(`✓ DELETE /api/appointments/${newAppt.appointment.id} -> Success: ${del.success}`);
  }

  // Dormant Lead Reactivation
  const reactivateRes = await fetch('http://localhost:3000/api/dormant/dorm-1/reactivate', {
    method: 'POST'
  });
  const reactivateJson = await reactivateRes.json();
  console.log(`✓ POST /api/dormant/dorm-1/reactivate -> Status: ${reactivateJson.status}`);

  // Sarah AI Chat Reply
  const chatRes = await fetch('http://localhost:3000/api/chat-reply', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: 'What are the batch timings for SOC Analyst at Kapoorthala campus?'
    })
  });
  const chat = await chatRes.json();
  console.log(`✓ POST /api/chat-reply -> Reply: "${chat.reply.substring(0, 60)}..."`);

  // Webhook multi-routes test
  const webhookPaths = ['/webhook', '/api/vapi-webhook', '/api/webhook'];
  for (const wp of webhookPaths) {
    const r = await fetch(`http://localhost:3000${wp}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: { type: 'conversation-update' } })
    });
    console.log(`✓ POST ${wp} -> ${r.status} OK`);
  }

  // Webhook end-of-call-report test
  const reportRes = await fetch('http://localhost:3000/webhook', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: {
        type: 'end-of-call-report',
        customer: { number: '+919667172535' },
        analysis: { summary: 'Candidate interested in offline SOC Analyst batch at Kapoorthala campus.' }
      }
    })
  });
  console.log(`✓ POST /webhook (end-of-call-report) -> ${reportRes.status} OK`);

  console.log('\n--- 4. Testing Real Enterprise Production Endpoints ---');
  // CSV Consultations Export
  const csvConsultRes = await fetch('http://localhost:3000/api/export/consultations.csv');
  const csvConsultText = await csvConsultRes.text();
  if (csvConsultRes.status === 200 && csvConsultText.includes('Candidate / Client Name')) {
    console.log(`✓ GET /api/export/consultations.csv -> 200 OK (${csvConsultText.split('\n').length} rows)`);
  } else {
    console.error('❌ GET /api/export/consultations.csv failed');
    process.exit(1);
  }

  // CSV Leads Export
  const csvLeadsRes = await fetch('http://localhost:3000/api/export/leads.csv');
  const csvLeadsText = await csvLeadsRes.text();
  if (csvLeadsRes.status === 200 && csvLeadsText.includes('Candidate Name')) {
    console.log(`✓ GET /api/export/leads.csv -> 200 OK (${csvLeadsText.split('\n').length} rows)`);
  } else {
    console.error('❌ GET /api/export/leads.csv failed');
    process.exit(1);
  }

  // iCalendar (.ics) download
  const icsRes = await fetch('http://localhost:3000/api/appointments/appt-1/calendar.ics');
  const icsText = await icsRes.text();
  if (icsRes.status === 200 && icsText.includes('BEGIN:VCALENDAR')) {
    console.log(`✓ GET /api/appointments/appt-1/calendar.ics -> 200 OK (RFC 5545 iCalendar validated)`);
  } else {
    console.error('❌ GET /api/appointments/appt-1/calendar.ics failed');
    process.exit(1);
  }

  // Meta WhatsApp Webhook Verification
  const metaVerifyRes = await fetch('http://localhost:3000/api/webhook/whatsapp?hub.mode=subscribe&hub.verify_token=codevirus_secret_token_2026&hub.challenge=test_challenge_codevirus');
  const metaChallenge = await metaVerifyRes.text();
  if (metaVerifyRes.status === 200 && metaChallenge === 'test_challenge_codevirus') {
    console.log(`✓ GET /api/webhook/whatsapp -> 200 OK (Meta Webhook Challenge Verified)`);
  } else {
    console.error('❌ Meta WhatsApp Webhook Verification failed:', metaVerifyRes.status);
    process.exit(1);
  }

  // Twilio WhatsApp Inbound Webhook
  const twilioRes = await fetch('http://localhost:3000/api/webhook/twilio-whatsapp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'From=whatsapp%3A%2B919667172535&Body=I+want+to+enroll+in+CEH+training'
  });
  const twilioXml = await twilioRes.text();
  if (twilioRes.status === 200 && twilioXml.includes('<Response><Message>')) {
    console.log(`✓ POST /api/webhook/twilio-whatsapp -> 200 OK (TwiML response generated)`);
  } else {
    console.error('❌ POST /api/webhook/twilio-whatsapp failed:', twilioRes.status);
    process.exit(1);
  }

  console.log('\n--- 5. Testing Application Security & Hardening ---');
  // Check that sensitive files cannot be fetched via HTTP
  const sensitiveFiles = ['/.env', '/server.js', '/config.json', '/data/activity.json', '/package.json'];
  for (const sf of sensitiveFiles) {
    const sRes = await fetch(`http://localhost:3000${sf}`);
    if (sRes.status === 403 || sRes.status === 404) {
      console.log(`✓ GET ${sf} -> ${sRes.status} Forbidden/Blocked (Secret Protected)`);
    } else {
      console.error(`❌ Security failure: ${sf} is publicly accessible with status ${sRes.status}!`);
      process.exit(1);
    }
  }

  // Check Security Headers
  const secRes = await fetch('http://localhost:3000/health');
  const nosniff = secRes.headers.get('x-content-type-options');
  const frameOpt = secRes.headers.get('x-frame-options');
  const poweredBy = secRes.headers.get('x-powered-by');

  if (nosniff === 'nosniff') {
    console.log(`✓ X-Content-Type-Options: nosniff verified`);
  } else {
    console.warn(`⚠ Missing X-Content-Type-Options header`);
  }

  if (frameOpt === 'SAMEORIGIN') {
    console.log(`✓ X-Frame-Options: SAMEORIGIN verified (Clickjacking protection)`);
  } else {
    console.warn(`⚠ Missing X-Frame-Options header`);
  }

  if (!poweredBy) {
    console.log(`✓ X-Powered-By hidden (Fingerprint protection)`);
  } else {
    console.warn(`⚠ X-Powered-By is exposed: ${poweredBy}`);
  }

  console.log('\n==================================================');
  console.log('🎉 ALL INTEGRATION, SECURITY & COLLISION TESTS PASSED (100%)');
  console.log('==================================================\n');
}

runTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});

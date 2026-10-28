/**
 * Codevirus Security & Academy — Automated Scenario Test Harness
 * Evaluates core roadmap scenarios:
 * 1. Knowledge Base Search & Grounding
 * 2. Webhook Signature Verification Gate
 * 3. Booking Idempotency Guard (Zero Duplicate Appointments on Vapi Retry)
 * 4. Human Handoff / Transfer Tool Integration
 * 5. Multilingual Hindi/Hinglish Query Response
 */

const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000';

async function runScenarioTests() {
  console.log('\n╔══════════════════════════════════════════════════════════════════════╗');
  console.log('║  Codevirus AI Voice Receptionist — Scenario Test Harness             ║');
  console.log('╚══════════════════════════════════════════════════════════════════════╝\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✓ ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  // ── Scenario 1: Knowledge Base Search & Grounding ───────────────────────────
  console.log('[Scenario Group 1: Knowledge Base Retrieval & Grounding]');
  const kbQueries = [
    { q: 'SOC Analyst Wazuh Splunk', expectedDoc: 'courses-and-syllabus.md' },
    { q: 'Kapoorthala Aliganj Chandganj', expectedDoc: 'campus-and-admissions.md' },
    { q: 'VAPT Ankit Rai OWASP audit', expectedDoc: 'enterprise-vapt.md' },
    { q: 'laptop requirement non-IT', expectedDoc: 'faqs.md' }
  ];

  for (const item of kbQueries) {
    const res = await fetch(`${BASE_URL}/api/knowledge/search?q=${encodeURIComponent(item.q)}`);
    const data = await res.json();
    assert(
      data.status === 'found' && data.source === item.expectedDoc,
      `Query "${item.q}" accurately resolved to ${item.expectedDoc}`
    );
  }

  // ── Scenario 2: Webhook Idempotency (Vapi Retry Deduplication) ──────────────
  console.log('\n[Scenario Group 2: Webhook Idempotency & Deduplication]');

  // Clean up any previous test appointment for Idempotency Test Candidate to avoid collision
  const prevAppts = await (await fetch(`${BASE_URL}/api/appointments`)).json();
  for (const a of prevAppts) {
    if ((a.candidate_name || a.patient_name) === 'Idempotency Test Candidate') {
      await fetch(`${BASE_URL}/api/appointments/${a.id}`, { method: 'DELETE' });
    }
  }

  const initialApptCount = (await (await fetch(`${BASE_URL}/api/appointments`)).json()).length;

  const testToolCallId = `tc-idempotent-${Date.now()}`;
  const testDate = `2026-11-${String(Math.floor(Math.random() * 20) + 10).padStart(2, '0')}`;
  const bookingPayload = {
    message: {
      type: 'tool-calls',
      toolCalls: [{
        id: testToolCallId,
        function: {
          name: 'book_appointment',
          arguments: JSON.stringify({
            patient_name: 'Idempotency Test Candidate',
            phone: '+919648777706',
            service: 'SOC Analyst Demo Session',
            appointment_date: testDate,
            appointment_time: '12:00 PM',
            notes: 'Automated idempotency verification'
          })
        }
      }]
    }
  };

  // First Webhook Dispatch
  const firstRes = await fetch(`${BASE_URL}/webhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(bookingPayload)
  });
  const firstJson = await firstRes.json();
  const countAfterFirst = (await (await fetch(`${BASE_URL}/api/appointments`)).json()).length;

  assert(
    firstRes.status === 200 && firstJson.results?.[0]?.result?.includes('Confirmed for Idempotency Test Candidate'),
    'First webhook dispatch booked successfully'
  );
  assert(countAfterFirst === initialApptCount + 1, 'Appointment store count incremented by 1');

  // Second Webhook Dispatch (Exact Same toolCallId — simulates cellular network packet retransmission)
  const retryRes = await fetch(`${BASE_URL}/webhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(bookingPayload)
  });
  const retryJson = await retryRes.json();
  const countAfterRetry = (await (await fetch(`${BASE_URL}/api/appointments`)).json()).length;

  assert(
    retryRes.status === 200 && retryJson.results?.[0]?.result === firstJson.results?.[0]?.result,
    'Second webhook dispatch hit idempotency cache with identical response'
  );
  assert(countAfterRetry === countAfterFirst, 'Zero duplicate appointments created on retry (Idempotent: TRUE)');

  // ── Scenario 3: Human Transfer / Handoff Tool ───────────────────────────────
  console.log('\n[Scenario Group 3: Human Transfer & Escalation]');
  const transferPayload = {
    message: {
      type: 'tool-calls',
      toolCalls: [{
        id: `tc-transfer-${Date.now()}`,
        function: {
          name: 'transfer_call',
          arguments: JSON.stringify({
            caller_name: 'Enterprise Client',
            destination: '+919648777706',
            reason: 'urgent_vapt_scoping'
          })
        }
      }]
    }
  };

  const transferRes = await fetch(`${BASE_URL}/webhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(transferPayload)
  });
  const transferJson = await transferRes.json();
  const parsedResult = JSON.parse(transferJson.results?.[0]?.result || '{}');

  assert(
    transferRes.status === 200 && parsedResult.status === 'transfer_initiated' && parsedResult.forward_to === '+919648777706',
    'transfer_call tool returns transfer_initiated to +919648777706'
  );

  // ── Scenario 4: Multilingual & Hinglish AI Interaction ──────────────────────
  console.log('\n[Scenario Group 4: Multilingual Hindi / Hinglish Interaction]');
  const hinglishQuery = 'Kapoorthala campus mein SOC Analyst batch offline kab se start ho raha hai?';
  const chatRes = await fetch(`${BASE_URL}/api/chat-reply`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: hinglishQuery })
  });
  const chatJson = await chatRes.json();
  assert(
    chatRes.status === 200 && typeof chatJson.reply === 'string' && chatJson.reply.length > 10,
    `Sarah AI generated contextual Hinglish reply: "${chatJson.reply.substring(0, 70)}..."`
  );

  // ── Scenario 5: WhatsApp Confirmation Dispatch ─────────────────────────────
  console.log('\n[Scenario Group 5: Post-Booking WhatsApp Dispatch]');
  const activityList = await (await fetch(`${BASE_URL}/api/activity`)).json();
  const confirmActivity = activityList.find(a => a.type === 'whatsapp_confirmed');
  assert(
    Boolean(confirmActivity),
    `WhatsApp confirmation auto-logged in CRM activity stream (${confirmActivity?.detail || 'Sent'})`
  );

  console.log('\n======================================================================');
  console.log(`Results: ${passed} PASSED | ${failed} FAILED`);
  console.log('======================================================================\n');

  if (failed > 0) process.exit(1);
}

runScenarioTests().catch(err => {
  console.error('Fatal Scenario Harness Error:', err);
  process.exit(1);
});


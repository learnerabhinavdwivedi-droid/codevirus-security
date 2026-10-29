/**
 * Codevirus Security — Background Automation & Scheduled Jobs
 */

const cron = require('node-cron');
const fetch = require('node-fetch');
const store = require('../db/localStore');
const supabase = require('../db/supabase');
const { getConfig, VAPI_PRIVATE_KEY } = require('../config');
const { extractLeadFields } = require('../services/messagingService');
const { refreshAssistantDate } = require('../services/telephonyService');

function startScheduledJobs() {
  // 1. Auto 48hr Follow-Up Cron (Hourly)
  cron.schedule('0 * * * *', async () => {
    const config = getConfig();
    if (!config.assistantId || !config.phoneNumberId || !supabase) return;

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
          method: 'POST',
          headers: {
            Authorization: `Bearer ${VAPI_PRIVATE_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            assistantId: config.assistantId,
            phoneNumberId: config.phoneNumberId,
            customer: { number: appt.phone, name: appt.patient_name },
            assistantOverrides: { firstMessage, firstMessageMode: 'assistant-speaks-first' }
          })
        })
          .then((r) => r.json())
          .then((d) => console.log(`[cron] Follow-up call triggered → ${appt.patient_name} (${d.id})`))
          .catch((err) => console.error(`[cron] Follow-up failed for ${appt.patient_name}:`, err.message));
      }
    } catch {}
  });

  // 2. Midnight IST Assistant Date Context Refresher
  cron.schedule('0 0 * * *', async () => {
    console.log('[cron] Midnight IST triggered — refreshing Sarah assistant date header…');
    await refreshAssistantDate();
  });

  // 3. Message Lead Extraction Poller (Every 5s)
  async function pollLeadCandidates() {
    try {
      if (supabase) {
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
                await supabase.from('demo_leads').insert([
                  {
                    message_id: msg.id,
                    name: fields.name || 'Prospective Lead',
                    phone: fields.phone,
                    treatment: fields.treatment || 'Cybersecurity Inquiry',
                    notes: fields.notes || null
                  }
                ]);
                console.log(`[extract] ✓ Codevirus Lead extracted (Supabase) → ${fields.name} (${fields.phone})`);
              } catch {}
            }
          }
        } catch {}
      }

      const localCandidates = store.getUnprocessedLeadMessages();
      for (const msg of localCandidates) {
        try {
          store.markMessageProcessed(msg.id);
          const fields = await extractLeadFields(msg.text);
          if (fields && fields.phone) {
            store.addLead({
              message_id: msg.id,
              name: fields.name || 'Prospective Lead',
              phone: fields.phone,
              treatment: fields.treatment || 'Cybersecurity Inquiry',
              notes: fields.notes || null
            });
            console.log(`[extract] ✓ Codevirus Lead extracted (Local) → ${fields.name} (${fields.phone})`);
          }
        } catch {}
      }
    } catch {}
  }

  setInterval(pollLeadCandidates, 5000);

  // 4. Extracted Leads Outbound Call Poller (Every 5s)
  async function pollDemoLeads() {
    const config = getConfig();
    if (!config.assistantId || !config.phoneNumberId || !VAPI_PRIVATE_KEY) return;

    try {
      let leadsToDial = [];

      if (supabase) {
        try {
          const { data, error } = await supabase
            .from('demo_leads')
            .update({ processed: true })
            .eq('processed', false)
            .select('*');
          if (!error && data?.length) leadsToDial = leadsToDial.concat(data);
        } catch {}
      }

      const localUnprocessed = store.getUnprocessedLeads();
      for (const l of localUnprocessed) {
        store.markLeadProcessed(l.id);
        leadsToDial.push(l);
      }

      for (const lead of leadsToDial) {
        console.log(`[leads] Outbound Lead received: ${lead.name} (${lead.phone}) → dialing…`);
        const customGreeting = `Hi ${lead.name || 'there'}, this is Sarah calling from Codevirus Security in Lucknow. I just saw your WhatsApp inquiry regarding ${lead.treatment || 'our cybersecurity programs and services'} — do you have a quick minute to chat so I can help you with the details or schedule your session?`;

        try {
          const vapiRes = await fetch('https://api.vapi.ai/call/phone', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${VAPI_PRIVATE_KEY}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              assistantId: config.assistantId,
              phoneNumberId: config.phoneNumberId,
              customer: { number: lead.phone, name: lead.name },
              assistantOverrides: {
                firstMessage: customGreeting,
                firstMessageMode: 'assistant-speaks-first',
                variableValues: { name: lead.name, treatment: lead.treatment, notes: lead.notes }
              }
            })
          });
          const result = await vapiRes.json();
          if (!vapiRes.ok) {
            console.error(`[leads] Vapi call error for ${lead.name}:`, JSON.stringify(result));
          } else {
            console.log(`[leads] ✓ Call created → ID: ${result.id} | ${lead.name} (${lead.phone})`);
          }
        } catch (err) {
          console.error(`[leads] Network error for ${lead.name}:`, err.message);
        }
      }
    } catch {}
  }

  setInterval(pollDemoLeads, 5000);
}

module.exports = {
  startScheduledJobs
};

/**
 * Codevirus Security — reset-demo.js
 * Wipes test rows and resets the demo database to a clean starting state before a presentation.
 * Supports both local JSON store and Supabase cloud.
 * Usage: node reset-demo.js
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const store = require('./local-store');

const SUPABASE_URL     = process.env.SUPABASE_URL     || '';
const SUPABASE_SERVICE = process.env.SUPABASE_SERVICE || '';

const supabase = (SUPABASE_URL && SUPABASE_SERVICE) ? createClient(SUPABASE_URL, SUPABASE_SERVICE) : null;

async function main() {
  console.log('\n╔══════════════════════════════════════════════════╗');
  console.log('║  Codevirus Security — Demo Reset                 ║');
  console.log('╚══════════════════════════════════════════════════╝\n');

  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });

  // 1. Reset Local Store
  console.log('▶ Resetting Local JSON Demo Store…');
  store.resetDemo();
  console.log('  ✓ Local appointments, dormant leads, and WhatsApp messages reset');

  // 2. Reset Supabase (if reachable)
  console.log('\n▶ Synchronizing with Supabase Cloud…');
  try {
    await supabase.from('appointments').delete().not('id', 'is', null);
    await supabase.from('demo_leads').delete().not('id', 'is', null);
    await supabase.from('demo_messages').delete().not('id', 'is', null);

    const rows = [
      {
        patient_name:     'Aarav Sharma',
        phone:            '+919667172535',
        service:          'SOC Analyst Career Counseling',
        appointment_date: today,
        appointment_time: '10:00 AM',
        status:           'completed',
        source:           'sarah',
        notes:            'Completed counseling — click Trigger Follow-Up Call'
      },
      {
        patient_name:     'Priya Tiwari',
        phone:            '+919667172535',
        service:          'VAPT & Network Security Audit',
        appointment_date: today,
        appointment_time: '2:00 PM',
        status:           'confirmed',
        source:           'sarah',
        notes:            'Confirmed — click Mark No-Show to trigger recovery call'
      },
      {
        patient_name:     'Siddharth Dubey',
        phone:            '+919839012345',
        service:          'Ethical Hacking & Bug Bounty',
        appointment_date: today,
        appointment_time: '4:30 PM',
        status:           'confirmed',
        source:           'front-desk',
        notes:            'Kapoorthala offline batch inquiry'
      }
    ];

    const { error } = await supabase.from('appointments').insert(rows);
    if (!error) {
      console.log('  ✓ Supabase cloud synchronized successfully');
    } else {
      console.warn('  ⚠ Supabase sync warning:', error.message);
    }
  } catch (err) {
    console.warn('  ⚠ Supabase unreachable (local demo store is active and working):', err.message);
  }

  console.log('\n✓ Demo Reset complete for', today);
  console.log('Open http://localhost:3000/dashboard.html to view!\n');
}

main().catch(err => {
  console.error('\n✗ Reset failed:', err.message);
  process.exit(1);
});

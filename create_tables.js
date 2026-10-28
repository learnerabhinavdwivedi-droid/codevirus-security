/**
 * Codevirus Security — create_tables.js
 * Creates all 4 Supabase tables, enables Realtime, and seeds Codevirus Security demo data.
 *
 * USAGE:
 *   SUPABASE_PAT=sbp_xxxx node create_tables.js
 */

require('dotenv').config();
const fetch = require('node-fetch');
const { createClient } = require('@supabase/supabase-js');

const PROJECT_REF      = process.env.SUPABASE_PROJECT_REF || 'eqyuwufbzbgaxwxrapqv';
const SUPABASE_URL     = process.env.SUPABASE_URL         || 'https://eqyuwufbzbgaxwxrapqv.supabase.co';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE     || '';
const PAT              = process.env.SUPABASE_PAT;

const SQL_STEPS = [
  {
    label: 'Create appointments table',
    sql: `CREATE TABLE IF NOT EXISTS appointments (
      id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
      patient_name     TEXT        NOT NULL,
      phone            TEXT,
      service          TEXT        NOT NULL,
      appointment_date TEXT,
      appointment_time TEXT,
      status           TEXT        DEFAULT 'confirmed',
      source           TEXT        DEFAULT 'front-desk',
      notes            TEXT,
      created_at       TIMESTAMPTZ DEFAULT NOW()
    )`
  },
  {
    label: 'Ensure notes & source columns on appointments',
    sql: `ALTER TABLE appointments ADD COLUMN IF NOT EXISTS notes TEXT;
          ALTER TABLE appointments ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'front-desk';`
  },
  {
    label: 'Create dormant_patients table',
    sql: `CREATE TABLE IF NOT EXISTS dormant_patients (
      id                  UUID  PRIMARY KEY DEFAULT gen_random_uuid(),
      name                TEXT  NOT NULL,
      phone               TEXT,
      last_visit          DATE,
      service_history     TEXT,
      reactivation_status TEXT  DEFAULT 'pending'
    )`
  },
  {
    label: 'Create demo_messages table',
    sql: `CREATE TABLE IF NOT EXISTS demo_messages (
      id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
      chat_id     TEXT        NOT NULL,
      sender      TEXT        NOT NULL,
      text        TEXT        NOT NULL,
      is_lead     BOOLEAN     DEFAULT FALSE,
      processed   BOOLEAN     DEFAULT FALSE,
      created_at  TIMESTAMPTZ DEFAULT NOW()
    )`
  },
  {
    label: 'Create demo_leads table',
    sql: `CREATE TABLE IF NOT EXISTS demo_leads (
      id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
      message_id  UUID        REFERENCES demo_messages(id),
      name        TEXT,
      phone       TEXT,
      treatment   TEXT,
      notes       TEXT,
      processed   BOOLEAN     DEFAULT FALSE,
      created_at  TIMESTAMPTZ DEFAULT NOW()
    )`
  },
  {
    label: 'Disable RLS on all tables',
    sql: `ALTER TABLE appointments     DISABLE ROW LEVEL SECURITY;
          ALTER TABLE dormant_patients DISABLE ROW LEVEL SECURITY;
          ALTER TABLE demo_messages    DISABLE ROW LEVEL SECURITY;
          ALTER TABLE demo_leads       DISABLE ROW LEVEL SECURITY;`
  },
  {
    label: 'Enable Realtime on appointments',
    sql: `DO $$ BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE appointments;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$`
  }
];

async function execSQL(sql, label) {
  const res = await fetch(
    `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
    {
      method:  'POST',
      headers: {
        'Authorization': `Bearer ${PAT}`,
        'Content-Type':  'application/json'
      },
      body: JSON.stringify({ query: sql })
    }
  );
  const body = await res.text();
  if (!res.ok) {
    if (body.toLowerCase().includes('already exists') || body.toLowerCase().includes('duplicate')) {
      console.log(`  ✓ ${label} (already exists)`);
      return true;
    }
    throw new Error(`${label}: ${res.status} — ${body.substring(0, 200)}`);
  }
  console.log(`  ✓ ${label}`);
  return true;
}

async function seedData() {
  console.log('\n▶ Seeding Codevirus Security demo data…');
  const sb    = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });

  await sb.from('appointments').delete().not('id', 'is', null);
  const { error: e1 } = await sb.from('appointments').insert([
    { patient_name: 'Aarav Sharma',    phone: '+919667172535', service: 'SOC Analyst Career Counseling', appointment_date: today, appointment_time: '10:00 AM', status: 'completed', source: 'sarah',      notes: 'Interested in placement guarantee & SIEM labs' },
    { patient_name: 'Priya Tiwari',    phone: '+919667172535', service: 'VAPT & Network Security Audit', appointment_date: today, appointment_time: '2:00 PM',  status: 'confirmed', source: 'sarah',      notes: 'Enterprise web app pentesting scope' },
    { patient_name: 'Siddharth Dubey', phone: '+919839012345', service: 'Ethical Hacking & Bug Bounty',  appointment_date: today, appointment_time: '4:30 PM',  status: 'confirmed', source: 'front-desk', notes: 'Kapoorthala offline batch inquiry' }
  ]);
  if (e1) throw new Error('Appointments seed: ' + e1.message);
  console.log('  ✓ Consultations seeded (3 rows)');

  await sb.from('dormant_patients').delete().not('id', 'is', null);
  const { error: e2 } = await sb.from('dormant_patients').insert([
    { name: 'Vikram Pratap Singh', phone: '+919876543210', last_visit: '2025-11-15', service_history: 'Enterprise VAPT & ISO 27001 Inquiry', reactivation_status: 'pending' },
    { name: 'Neha Verma',          phone: '+919812345678', last_visit: '2025-10-20', service_history: 'SOC Analyst & SIEM Training Demo',    reactivation_status: 'pending' },
    { name: 'Rohan Malhotra',      phone: '+919711223344', last_visit: '2025-12-01', service_history: 'Cloud Security (AWS) Diploma Inquiry', reactivation_status: 'pending' }
  ]);
  if (e2) throw new Error('Dormant leads seed: ' + e2.message);
  console.log('  ✓ Dormant leads seeded (3 rows)');
}

async function main() {
  if (!PAT) {
    console.error('Error: SUPABASE_PAT environment variable is required.\nRun: SUPABASE_PAT=sbp_xxxx node create_tables.js');
    process.exit(1);
  }
  console.log('\n╔══════════════════════════════════════════════════════╗');
  console.log('║  Codevirus Security — Supabase Schema & Seed Setup   ║');
  console.log('╚══════════════════════════════════════════════════════╝\n');

  for (const step of SQL_STEPS) {
    await execSQL(step.sql, step.label);
  }
  await seedData();
  console.log('\n✓ All tables created and seeded for Codevirus Security!\n');
}

main().catch(err => {
  console.error('\n✗ Failed:', err.message);
  process.exit(1);
});

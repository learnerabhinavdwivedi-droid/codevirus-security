-- ================================================================
-- Codevirus Security — AI Calling & Consultation Management System
-- Run this entire script in Supabase Dashboard → SQL Editor
-- ================================================================

-- 1. Create appointments table (Consultations, VAPT Audits & Demo Sessions)
CREATE TABLE IF NOT EXISTS appointments (
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
);

-- Ensure columns exist if upgrading an older database
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS notes  TEXT;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'front-desk';

-- 2. Create dormant_patients table (Dormant Leads / Past Enquirers)
CREATE TABLE IF NOT EXISTS dormant_patients (
  id                   UUID  PRIMARY KEY DEFAULT gen_random_uuid(),
  name                 TEXT  NOT NULL,
  phone                TEXT,
  last_visit           DATE,
  service_history      TEXT,
  reactivation_status  TEXT  DEFAULT 'pending'
);

-- 3. Create demo_messages table (WhatsApp Lead Capture)
CREATE TABLE IF NOT EXISTS demo_messages (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id     TEXT        NOT NULL,
  sender      TEXT        NOT NULL,
  text        TEXT        NOT NULL,
  is_lead     BOOLEAN     DEFAULT FALSE,
  processed   BOOLEAN     DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create demo_leads table (LLM-Extracted Calling Queue)
CREATE TABLE IF NOT EXISTS demo_leads (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id  UUID        REFERENCES demo_messages(id),
  name        TEXT,
  phone       TEXT,
  treatment   TEXT,
  notes       TEXT,
  processed   BOOLEAN     DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE demo_leads ADD COLUMN IF NOT EXISTS notes TEXT;

-- 5. Disable RLS for demo access
ALTER TABLE appointments     DISABLE ROW LEVEL SECURITY;
ALTER TABLE dormant_patients DISABLE ROW LEVEL SECURITY;
ALTER TABLE demo_messages    DISABLE ROW LEVEL SECURITY;
ALTER TABLE demo_leads       DISABLE ROW LEVEL SECURITY;

-- 6. Enable Realtime on appointments
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE appointments;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 7. Clear existing demo rows and seed Codevirus Security data
DELETE FROM appointments;
DELETE FROM dormant_patients;

INSERT INTO dormant_patients (name, phone, last_visit, service_history, reactivation_status)
VALUES
  ('Vikram Pratap Singh', '+919876543210', '2025-11-15', 'Enterprise VAPT & ISO 27001 Inquiry', 'pending'),
  ('Neha Verma',          '+919812345678', '2025-10-20', 'SOC Analyst & SIEM Training Demo',    'pending'),
  ('Rohan Malhotra',      '+919711223344', '2025-12-01', 'Cloud Security (AWS) Diploma Inquiry', 'pending');

INSERT INTO appointments (patient_name, phone, service, appointment_date, appointment_time, status, source, notes)
VALUES
  ('Aarav Sharma',   '+919667172535', 'SOC Analyst Career Counseling', CURRENT_DATE::TEXT, '10:00 AM', 'completed', 'sarah',      'Interested in placement guarantee & SIEM labs'),
  ('Priya Tiwari',   '+919667172535', 'VAPT & Network Security Audit', CURRENT_DATE::TEXT, '02:00 PM', 'confirmed', 'sarah',      'Enterprise web app pentesting scope'),
  ('Siddharth Dubey','+919839012345', 'Ethical Hacking & Bug Bounty',  CURRENT_DATE::TEXT, '04:30 PM', 'confirmed', 'front-desk', 'Kapoorthala offline batch inquiry');

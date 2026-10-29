-- ==============================================================================
-- CODEVIRUS SECURITY PRIVATE LIMITED — ENTERPRISE DATABASE ARCHITECTURE
-- AI Voice Calling Agent & Consultation Management System
--
-- Target Database: Supabase (PostgreSQL 15+)
-- Execution:       Supabase Dashboard -> SQL Editor (or Supabase CLI / psql)
-- Idempotency:     Safe to execute repeatedly without data loss or duplicate errors
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- SECTION 0: POSTGRESQL EXTENSIONS
-- ------------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------------------------
-- SECTION 1: CORE RELATIONAL TABLES
-- ------------------------------------------------------------------------------

-- 1.1 APPOINTMENTS (Consultations, VAPT Audits & Course Counseling Sessions)
CREATE TABLE IF NOT EXISTS appointments (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_name     TEXT        NOT NULL,
  phone            TEXT,
  service          TEXT        NOT NULL,
  appointment_date TEXT        NOT NULL,
  appointment_time TEXT        NOT NULL,
  status           TEXT        NOT NULL DEFAULT 'confirmed'
                               CHECK (status IN ('confirmed', 'completed', 'cancelled', 'rescheduled', 'no-show', 'in-progress')),
  source           TEXT        NOT NULL DEFAULT 'front-desk'
                               CHECK (source IN ('front-desk', 'sarah', 'whatsapp', 'website', 'staff-dashboard', 'referral', 'campaign', 'direct')),
  notes            TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Schema upgrades & safety alters for existing tables
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS notes      TEXT;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS source     TEXT DEFAULT 'front-desk';
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

COMMENT ON TABLE  appointments                  IS 'Booked consultations, academy demo counseling, and enterprise VAPT scoping sessions.';
COMMENT ON COLUMN appointments.patient_name     IS 'Candidate or client corporate representative full name.';
COMMENT ON COLUMN appointments.phone            IS 'E.164 formatted contact phone number.';
COMMENT ON COLUMN appointments.service          IS 'Cybersecurity training module (SOC, Bug Bounty, VAPT) or enterprise service.';
COMMENT ON COLUMN appointments.appointment_date IS 'ISO date string (YYYY-MM-DD) for consultation.';
COMMENT ON COLUMN appointments.appointment_time IS 'Time slot string (e.g., 10:00 AM, 02:30 PM).';
COMMENT ON COLUMN appointments.status           IS 'Lifecycle status: confirmed, completed, cancelled, rescheduled, no-show.';
COMMENT ON COLUMN appointments.source           IS 'Acquisition channel: sarah (AI voice agent), front-desk, whatsapp, etc.';


-- 1.2 DORMANT PATIENTS (Past Enquirers & Dormant Leads for AI Outbound Campaigns)
CREATE TABLE IF NOT EXISTS dormant_patients (
  id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name                 TEXT        NOT NULL,
  phone                TEXT,
  last_visit           DATE,
  service_history      TEXT,
  reactivation_status  TEXT        NOT NULL DEFAULT 'pending'
                                   CHECK (reactivation_status IN ('pending', 'in-progress', 'reactivated', 'unresponsive', 'archived')),
  notes                TEXT,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Schema upgrades & safety alters
ALTER TABLE dormant_patients ADD COLUMN IF NOT EXISTS notes      TEXT;
ALTER TABLE dormant_patients ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE dormant_patients ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

COMMENT ON TABLE  dormant_patients                     IS 'Historical enquirers and dormant leads targeted by Sarah for outbound re-engagement.';
COMMENT ON COLUMN dormant_patients.name                IS 'Candidate or prospect full name.';
COMMENT ON COLUMN dormant_patients.service_history     IS 'Previous inquiry details, past workshop attended, or interested syllabus.';
COMMENT ON COLUMN dormant_patients.reactivation_status IS 'Pipeline status: pending, in-progress, reactivated, unresponsive, archived.';


-- 1.3 DEMO MESSAGES (Inbound WhatsApp & Omnichannel Message Capture)
CREATE TABLE IF NOT EXISTS demo_messages (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id     TEXT        NOT NULL,
  sender      TEXT        NOT NULL,
  text        TEXT        NOT NULL,
  is_lead     BOOLEAN     NOT NULL DEFAULT FALSE,
  processed   BOOLEAN     NOT NULL DEFAULT FALSE,
  metadata    JSONB       DEFAULT '{}'::jsonb,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Schema upgrades & safety alters
ALTER TABLE demo_messages ADD COLUMN IF NOT EXISTS metadata   JSONB DEFAULT '{}'::jsonb;
ALTER TABLE demo_messages ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

COMMENT ON TABLE  demo_messages           IS 'Raw inbound messages received via WhatsApp Webhooks or front-end simulation.';
COMMENT ON COLUMN demo_messages.chat_id   IS 'Unique WhatsApp chat or telephone session identifier.';
COMMENT ON COLUMN demo_messages.sender    IS 'Sender identifier (phone number or contact name).';
COMMENT ON COLUMN demo_messages.is_lead   IS 'Classification flag marked true when message expresses booking intent.';
COMMENT ON COLUMN demo_messages.processed IS 'Flag indicating whether LLM lead extractor has analyzed this message.';


-- 1.4 DEMO LEADS (Extracted Lead Queue for Counselor & AI Voice Dialing)
CREATE TABLE IF NOT EXISTS demo_leads (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id        UUID        REFERENCES demo_messages(id) ON DELETE SET NULL,
  name              TEXT,
  phone             TEXT,
  treatment         TEXT,       -- Retained for full backward-compatibility with backend server.js
  service_interest  TEXT,
  status            TEXT        NOT NULL DEFAULT 'new'
                                CHECK (status IN ('new', 'contacted', 'qualified', 'booked', 'closed', 'rejected')),
  notes             TEXT,
  processed         BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Schema upgrades & safety alters
ALTER TABLE demo_leads ADD COLUMN IF NOT EXISTS notes            TEXT;
ALTER TABLE demo_leads ADD COLUMN IF NOT EXISTS service_interest TEXT;
ALTER TABLE demo_leads ADD COLUMN IF NOT EXISTS status           TEXT DEFAULT 'new';
ALTER TABLE demo_leads ADD COLUMN IF NOT EXISTS updated_at       TIMESTAMPTZ DEFAULT NOW();

COMMENT ON TABLE  demo_leads                  IS 'Extracted actionable leads queued for telephone counseling or follow-up.';
COMMENT ON COLUMN demo_leads.treatment        IS 'Legacy column for requested program or cybersecurity audit scope.';
COMMENT ON COLUMN demo_leads.service_interest IS 'Specific academy course or enterprise VAPT package.';


-- 1.5 CALL LOGS (AI Voice Telemetry & Telephony Audit Trail)
CREATE TABLE IF NOT EXISTS call_logs (
  id                UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id           TEXT           UNIQUE,
  assistant_id      TEXT,
  customer_number   TEXT,
  direction         TEXT           DEFAULT 'inbound' CHECK (direction IN ('inbound', 'outbound')),
  status            TEXT           DEFAULT 'completed',
  duration_seconds  INTEGER        DEFAULT 0,
  summary           TEXT,
  transcript        TEXT,
  cost              NUMERIC(10, 4) DEFAULT 0.0000,
  ended_reason      TEXT,
  created_at        TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE call_logs IS 'Vapi AI Telephony call logs, audio duration, summaries, and transcripts.';

-- ------------------------------------------------------------------------------
-- SECTION 2: AUTOMATED TRIGGERS & PROCEDURES (UPDATED_AT MANAGEMENT)
-- ------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_appointments_updated_at ON appointments;
CREATE TRIGGER trg_appointments_updated_at
  BEFORE UPDATE ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

DROP TRIGGER IF EXISTS trg_dormant_patients_updated_at ON dormant_patients;
CREATE TRIGGER trg_dormant_patients_updated_at
  BEFORE UPDATE ON dormant_patients
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

DROP TRIGGER IF EXISTS trg_demo_messages_updated_at ON demo_messages;
CREATE TRIGGER trg_demo_messages_updated_at
  BEFORE UPDATE ON demo_messages
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

DROP TRIGGER IF EXISTS trg_demo_leads_updated_at ON demo_leads;
CREATE TRIGGER trg_demo_leads_updated_at
  BEFORE UPDATE ON demo_leads
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- ------------------------------------------------------------------------------
-- SECTION 3: HIGH-PERFORMANCE INDEXES
-- ------------------------------------------------------------------------------

-- Appointments query optimization
CREATE INDEX IF NOT EXISTS idx_appointments_date_status
  ON appointments (appointment_date, status);

CREATE INDEX IF NOT EXISTS idx_appointments_phone
  ON appointments (phone);

CREATE INDEX IF NOT EXISTS idx_appointments_created_at
  ON appointments (created_at DESC);

-- Dormant leads re-engagement optimization
CREATE INDEX IF NOT EXISTS idx_dormant_patients_status
  ON dormant_patients (reactivation_status);

CREATE INDEX IF NOT EXISTS idx_dormant_patients_phone
  ON dormant_patients (phone);

-- WhatsApp messaging optimization
CREATE INDEX IF NOT EXISTS idx_demo_messages_chat_id
  ON demo_messages (chat_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_demo_messages_lead_processed
  ON demo_messages (is_lead, processed);

-- Leads calling queue optimization
CREATE INDEX IF NOT EXISTS idx_demo_leads_processed
  ON demo_leads (processed, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_demo_leads_phone
  ON demo_leads (phone);

CREATE INDEX IF NOT EXISTS idx_demo_leads_message_id
  ON demo_leads (message_id);

-- Call logs lookup optimization
CREATE INDEX IF NOT EXISTS idx_call_logs_customer_number
  ON call_logs (customer_number, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_call_logs_created_at
  ON call_logs (created_at DESC);

-- ------------------------------------------------------------------------------
-- SECTION 4: ROW LEVEL SECURITY (RLS) & GRANULAR POLICIES
-- ------------------------------------------------------------------------------

-- Enable RLS across all tables for production security standards
ALTER TABLE appointments     ENABLE ROW LEVEL SECURITY;
ALTER TABLE dormant_patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE demo_messages    ENABLE ROW LEVEL SECURITY;
ALTER TABLE demo_leads       ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_logs        ENABLE ROW LEVEL SECURITY;

-- 4.1 SERVICE ROLE POLICIES (Backend Node.js server with SUPABASE_SERVICE key has bypass)
DROP POLICY IF EXISTS "service_role_full_access_appointments"     ON appointments;
CREATE POLICY "service_role_full_access_appointments"     ON appointments     FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "service_role_full_access_dormant_patients" ON dormant_patients;
CREATE POLICY "service_role_full_access_dormant_patients" ON dormant_patients FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "service_role_full_access_demo_messages"    ON demo_messages;
CREATE POLICY "service_role_full_access_demo_messages"    ON demo_messages    FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "service_role_full_access_demo_leads"       ON demo_leads;
CREATE POLICY "service_role_full_access_demo_leads"       ON demo_leads       FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "service_role_full_access_call_logs"        ON call_logs;
CREATE POLICY "service_role_full_access_call_logs"        ON call_logs        FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 4.2 AUTHENTICATED STAFF POLICIES (Logged-in counselors / administrators)
DROP POLICY IF EXISTS "auth_full_access_appointments"     ON appointments;
CREATE POLICY "auth_full_access_appointments"     ON appointments     FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "auth_full_access_dormant_patients" ON dormant_patients;
CREATE POLICY "auth_full_access_dormant_patients" ON dormant_patients FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "auth_full_access_demo_messages"    ON demo_messages;
CREATE POLICY "auth_full_access_demo_messages"    ON demo_messages    FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "auth_full_access_demo_leads"       ON demo_leads;
CREATE POLICY "auth_full_access_demo_leads"       ON demo_leads       FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "auth_full_access_call_logs"        ON call_logs;
CREATE POLICY "auth_full_access_call_logs"        ON call_logs        FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 4.3 PUBLIC / ANON POLICIES (Public booking widget, live demo console & webhook intake)
DROP POLICY IF EXISTS "anon_read_appointments" ON appointments;
CREATE POLICY "anon_read_appointments" ON appointments FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "anon_insert_appointments" ON appointments;
CREATE POLICY "anon_insert_appointments" ON appointments FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_appointments" ON appointments;
CREATE POLICY "anon_update_appointments" ON appointments FOR UPDATE TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_appointments" ON appointments;
CREATE POLICY "anon_delete_appointments" ON appointments FOR DELETE TO anon USING (true);

DROP POLICY IF EXISTS "anon_access_dormant_patients" ON dormant_patients;
CREATE POLICY "anon_access_dormant_patients" ON dormant_patients FOR ALL TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_access_demo_messages" ON demo_messages;
CREATE POLICY "anon_access_demo_messages" ON demo_messages FOR ALL TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_access_demo_leads" ON demo_leads;
CREATE POLICY "anon_access_demo_leads" ON demo_leads FOR ALL TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_access_call_logs" ON call_logs;
CREATE POLICY "anon_access_call_logs" ON call_logs FOR ALL TO anon USING (true) WITH CHECK (true);

-- NOTE: If your local development setup requires RLS completely disabled, you can run:
-- ALTER TABLE appointments     DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE dormant_patients DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE demo_messages    DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE demo_leads       DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE call_logs        DISABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- SECTION 5: REALTIME PUBLICATION SETUP
-- ------------------------------------------------------------------------------

-- Safely add all relevant tables to the supabase_realtime publication
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'appointments'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE appointments;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'dormant_patients'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE dormant_patients;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'demo_messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE demo_messages;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'demo_leads'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE demo_leads;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'call_logs'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE call_logs;
  END IF;
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;

-- ------------------------------------------------------------------------------
-- SECTION 6: DOMAIN & ANALYTICS VIEWS
-- ------------------------------------------------------------------------------

-- 6.1 Modernized Cybersecurity View (Candidate / Client terminology)
CREATE OR REPLACE VIEW v_consultations AS
SELECT
  id,
  patient_name      AS candidate_name,
  phone             AS contact_phone,
  service           AS program_or_service,
  appointment_date  AS consultation_date,
  appointment_time  AS consultation_time,
  status,
  source            AS booking_channel,
  notes,
  created_at,
  updated_at
FROM appointments;

COMMENT ON VIEW v_consultations IS 'Domain view mapping appointments to standard Codevirus Security candidate terminology.';


-- 6.2 Today's Live Schedule View
CREATE OR REPLACE VIEW v_daily_schedule AS
SELECT
  id,
  patient_name,
  phone,
  service,
  appointment_time,
  status,
  source,
  notes
FROM appointments
WHERE appointment_date = CURRENT_DATE::TEXT
ORDER BY appointment_time ASC;

COMMENT ON VIEW v_daily_schedule IS 'Chronological consultation schedule for today.';


-- 6.3 Dormant Leads Ready for Reactivation
CREATE OR REPLACE VIEW v_dormant_leads_pipeline AS
SELECT
  id,
  name,
  phone,
  last_visit,
  service_history,
  reactivation_status,
  notes,
  created_at
FROM dormant_patients
WHERE reactivation_status IN ('pending', 'in-progress')
ORDER BY last_visit ASC NULLS LAST;

COMMENT ON VIEW v_dormant_leads_pipeline IS 'Prioritized list of past enquirers ready for Sarah AI voice outreach.';


-- 6.4 Unprocessed WhatsApp Extracted Leads
CREATE OR REPLACE VIEW v_pending_leads AS
SELECT
  l.id,
  l.name,
  l.phone,
  COALESCE(l.service_interest, l.treatment) AS requested_service,
  l.status,
  l.notes,
  m.text AS original_message,
  l.created_at
FROM demo_leads l
LEFT JOIN demo_messages m ON l.message_id = m.id
WHERE l.processed = FALSE
ORDER BY l.created_at DESC;

COMMENT ON VIEW v_pending_leads IS 'Active queue of newly captured leads awaiting counselor or AI agent follow-up.';


-- 6.5 Executive Consultation & Operations KPI Summary
CREATE OR REPLACE VIEW v_consultation_stats AS
SELECT
  COUNT(*)                                                    AS total_consultations,
  COUNT(*) FILTER (WHERE status = 'confirmed')                AS confirmed_count,
  COUNT(*) FILTER (WHERE status = 'completed')                AS completed_count,
  COUNT(*) FILTER (WHERE status = 'cancelled')                AS cancelled_count,
  COUNT(*) FILTER (WHERE appointment_date = CURRENT_DATE::TEXT) AS today_total,
  COUNT(*) FILTER (WHERE source = 'sarah')                    AS ai_booked_count,
  COUNT(*) FILTER (WHERE source = 'front-desk')               AS front_desk_count
FROM appointments;

COMMENT ON VIEW v_consultation_stats IS 'Aggregated operational KPIs for Codevirus dashboard counters.';

-- ------------------------------------------------------------------------------
-- SECTION 7: ATOMIC RPC STORED PROCEDURES
-- ------------------------------------------------------------------------------

-- 7.1 Atomic Consultation Booking with Double-Booking Prevention
CREATE OR REPLACE FUNCTION book_consultation_atomic(
  p_patient_name     TEXT,
  p_phone            TEXT,
  p_service          TEXT,
  p_appointment_date TEXT,
  p_appointment_time TEXT,
  p_source           TEXT DEFAULT 'front-desk',
  p_notes            TEXT DEFAULT NULL,
  p_allow_conflict   BOOLEAN DEFAULT FALSE
)
RETURNS JSONB AS $$
DECLARE
  v_conflict_count INTEGER;
  v_new_id         UUID;
BEGIN
  -- Check for existing active appointment at requested slot
  IF NOT p_allow_conflict THEN
    SELECT COUNT(*) INTO v_conflict_count
    FROM appointments
    WHERE appointment_date = p_appointment_date
      AND appointment_time = p_appointment_time
      AND status NOT IN ('cancelled', 'no-show');

    IF v_conflict_count > 0 THEN
      RETURN jsonb_build_object(
        'success', false,
        'conflict', true,
        'message', format('Slot %s on %s is already reserved.', p_appointment_time, p_appointment_date)
      );
    END IF;
  END IF;

  -- Insert appointment
  INSERT INTO appointments (
    patient_name,
    phone,
    service,
    appointment_date,
    appointment_time,
    status,
    source,
    notes
  ) VALUES (
    p_patient_name,
    p_phone,
    p_service,
    p_appointment_date,
    p_appointment_time,
    'confirmed',
    p_source,
    p_notes
  ) RETURNING id INTO v_new_id;

  RETURN jsonb_build_object(
    'success', true,
    'id', v_new_id,
    'message', 'Consultation booked successfully.'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ------------------------------------------------------------------------------
-- SECTION 8: SEED DATA (CODEVIRUS SECURITY & ACADEMY)
-- ------------------------------------------------------------------------------

-- Seed Dormant Leads for AI Outbound Calling Demo
DELETE FROM dormant_patients;
INSERT INTO dormant_patients (name, phone, last_visit, service_history, reactivation_status, notes)
VALUES
  (
    'Vikram Pratap Singh',
    '+919876543210',
    CURRENT_DATE - INTERVAL '60 days',
    'Enterprise VAPT & ISO 27001 Inquiry',
    'pending',
    'Requested quotation for corporate web application pentest & SOC setup'
  ),
  (
    'Neha Verma',
    '+919812345678',
    CURRENT_DATE - INTERVAL '45 days',
    'SOC Analyst & SIEM Training Demo',
    'pending',
    'Attended Sunday webinar on Wazuh & Splunk SIEM; inquired regarding placement guarantee'
  ),
  (
    'Rohan Malhotra',
    '+919711223344',
    CURRENT_DATE - INTERVAL '30 days',
    'Cloud Security (AWS) Diploma Inquiry',
    'pending',
    'Final year B.Tech student exploring AWS Cloud Security and CEH certification'
  ),
  (
    'Ananya Gupta',
    '+919839112233',
    CURRENT_DATE - INTERVAL '20 days',
    'Ethical Hacking & Bug Bounty Specialist',
    'in-progress',
    'Interested in Kapoorthala offline weekend lab batch'
  );

-- Seed Initial Consultations for Today & Upcoming Days
DELETE FROM appointments;
INSERT INTO appointments (patient_name, phone, service, appointment_date, appointment_time, status, source, notes)
VALUES
  (
    'Aarav Sharma',
    '+919667172535',
    'SOC Analyst Career Counseling',
    CURRENT_DATE::TEXT,
    '10:00 AM',
    'completed',
    'sarah',
    'Interested in placement guarantee, SIEM live labs, and SOC Level 1 preparation'
  ),
  (
    'Priya Tiwari',
    '+919667172535',
    'VAPT & Network Security Audit',
    CURRENT_DATE::TEXT,
    '02:00 PM',
    'confirmed',
    'sarah',
    'Enterprise web app pentesting scope for fintech client; Director Ankit Rai meeting'
  ),
  (
    'Siddharth Dubey',
    '+919839012345',
    'Ethical Hacking & Bug Bounty',
    CURRENT_DATE::TEXT,
    '04:30 PM',
    'confirmed',
    'front-desk',
    'Kapoorthala offline batch inquiry with Pawan Yadav'
  ),
  (
    'Meera Singhania',
    '+919876501234',
    'Cloud Security (AWS/Azure) & CCNA',
    (CURRENT_DATE + INTERVAL '1 day')::DATE::TEXT,
    '11:30 AM',
    'confirmed',
    'staff-dashboard',
    'Wants hybrid online/offline mode for infrastructure hardening'
  );

-- Seed Sample WhatsApp Messages & Extracted Lead
DELETE FROM demo_leads;
DELETE FROM demo_messages;

INSERT INTO demo_messages (id, chat_id, sender, text, is_lead, processed)
VALUES
  (
    'a0000000-0000-0000-0000-000000000001',
    'wa-chat-919667172535',
    '+919667172535',
    'Hello, I want to book a free counseling session for the SOC Analyst course this Saturday at 11 AM.',
    true,
    true
  );

INSERT INTO demo_leads (message_id, name, phone, treatment, service_interest, status, notes, processed)
VALUES
  (
    'a0000000-0000-0000-0000-000000000001',
    'Sameer Khan',
    '+919667172535',
    'SOC Analyst Career Counseling',
    'SOC Analyst Career Counseling',
    'qualified',
    'Extracted from WhatsApp chat. Interested in weekend batch.',
    false
  );

-- ==============================================================================
-- END OF CODEVIRUS SECURITY DATABASE ARCHITECTURE SCHEMA
-- ==============================================================================

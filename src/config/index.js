/**
 * Codevirus Security — Configuration & Environment Manager
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '../../');
const CONFIG_PATH = path.join(ROOT_DIR, 'config.json');

const PORT = Number(process.env.PORT) || 3000;
const VAPI_PRIVATE_KEY = process.env.VAPI_PRIVATE_KEY || '';
const VAPI_PUBLIC_KEY = process.env.VAPI_PUBLIC_KEY || '';
const VAPI_WEBHOOK_SECRET = process.env.VAPI_WEBHOOK_SECRET || '';
const INDIA_PHONE_NUMBER = process.env.INDIA_PHONE_NUMBER || process.env.TWILIO_NUMBER || '+919648777706';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE = process.env.SUPABASE_SERVICE || process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';
const ADMIN_API_KEY = process.env.ADMIN_API_KEY || '';

const STAFF_ACCOUNTS = [
  {
    email: 'admin@codevirussec.in',
    password: process.env.ADMIN_PASSWORD || 'codevirus2026',
    name: 'Ankit Rai',
    role: 'Director'
  },
  {
    email: 'counselor@codevirussec.in',
    password: process.env.COUNSELOR_PASSWORD || 'counselor2026',
    name: 'Admissions Desk',
    role: 'Senior Counselor'
  }
];

let diskConfig = {
  assistantId: process.env.ASSISTANT_ID || '399183dd-b23a-4558-a0d1-c3646fa3f8f9',
  phoneNumberId: process.env.PHONE_NUMBER_ID || '89cefd49-3647-4df2-90c2-f1419972c3a7',
  vapiKey: VAPI_PUBLIC_KEY,
  vapiPublicKey: VAPI_PUBLIC_KEY,
  supabaseUrl: SUPABASE_URL,
  webhookUrl: null,
  tunnelUrl: null
};

function reloadConfig() {
  if (fs.existsSync(CONFIG_PATH)) {
    try {
      const raw = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
      diskConfig = { ...diskConfig, ...raw };
      if (diskConfig.vapiKey === VAPI_PRIVATE_KEY) {
        diskConfig.vapiKey = raw.vapiPublicKey || VAPI_PUBLIC_KEY;
      }
    } catch {
      // Ignore malformed json on concurrent write
    }
  }
  return diskConfig;
}

reloadConfig();

function getConfig() {
  return diskConfig;
}

function updateConfig(newFields) {
  diskConfig = { ...diskConfig, ...newFields };
  try {
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(diskConfig, null, 2), 'utf8');
  } catch (err) {
    console.warn('[config] Failed to persist config.json:', err.message);
  }
  return diskConfig;
}

module.exports = {
  ROOT_DIR,
  CONFIG_PATH,
  PORT,
  VAPI_PRIVATE_KEY,
  VAPI_PUBLIC_KEY,
  VAPI_WEBHOOK_SECRET,
  INDIA_PHONE_NUMBER,
  OPENAI_API_KEY,
  SUPABASE_URL,
  SUPABASE_SERVICE,
  SUPABASE_ANON_KEY,
  ADMIN_API_KEY,
  STAFF_ACCOUNTS,
  reloadConfig,
  getConfig,
  updateConfig
};

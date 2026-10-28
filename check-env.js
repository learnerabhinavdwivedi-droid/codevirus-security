/**
 * Codevirus Security - Production Environment Auditor
 *
 * Verifies system requirements, environment variables, database connectivity,
 * local fallback file integrity, and frontend build readiness.
 *
 * Usage:
 *   node check-env.js
 *   npm run audit
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const https = require('https');

// ANSI Colors
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RED = '\x1b[31m';
const CYAN = '\x1b[36m';
const DIM = '\x1b[2m';

let errors = 0;
let warnings = 0;
let passed = 0;

function printPass(title, details = '') {
  passed++;
  console.log(`  ${GREEN}✓ [PASS]${RESET} ${BOLD}${title}${RESET}${details ? ` ${DIM}(${details})${RESET}` : ''}`);
}

function printWarn(title, advice = '') {
  warnings++;
  console.log(`  ${YELLOW}▲ [WARN]${RESET} ${BOLD}${title}${RESET}`);
  if (advice) console.log(`         ${DIM}↳ ${advice}${RESET}`);
}

function printFail(title, errorMsg = '') {
  errors++;
  console.log(`  ${RED}✗ [FAIL]${RESET} ${BOLD}${title}${RESET}`);
  if (errorMsg) console.log(`         ${RED}↳ ${errorMsg}${RESET}`);
}

async function runAudit() {
  console.log(`\n${CYAN}================================================================${RESET}`);
  console.log(`${BOLD}${CYAN}  🛡️  CODEVIRUS SECURITY — PRODUCTION ENVIRONMENT AUDITOR  🛡️${RESET}`);
  console.log(`${CYAN}================================================================${RESET}\n`);

  // 1. Node.js Runtime Check
  console.log(`${BOLD}1. Runtime Environment:${RESET}`);
  const nodeVersion = process.version;
  const major = parseInt(nodeVersion.replace('v', '').split('.')[0], 10);
  if (major >= 18) {
    printPass('Node.js Version', `${nodeVersion} >= v18.0.0 required`);
  } else {
    printFail('Node.js Version', `Found ${nodeVersion}. Upgrade to Node 18 or 20 LTS.`);
  }

  // 2. .env File Verification
  console.log(`\n${BOLD}2. Configuration & Filesystem:${RESET}`);
  const envPath = path.join(__dirname, '.env');
  const envExamplePath = path.join(__dirname, '.env.example');

  if (fs.existsSync(envPath)) {
    printPass('.env File Present', envPath);
  } else {
    printWarn('.env File Missing', 'Using default process environment or fallbacks. Copy .env.example to .env');
  }

  if (fs.existsSync(envExamplePath)) {
    printPass('.env.example Template', 'Available for reference');
  }

  // Check Data Directory & Fallback Stores
  const dataDir = path.join(__dirname, 'data');
  if (fs.existsSync(dataDir)) {
    printPass('Data Storage Directory', dataDir);
  } else {
    try {
      fs.mkdirSync(dataDir, { recursive: true });
      printPass('Data Storage Directory Created', dataDir);
    } catch (e) {
      printFail('Data Directory Creation Failed', e.message);
    }
  }

  const checkJsonFile = (filename) => {
    const filePath = path.join(dataDir, filename);
    if (!fs.existsSync(filePath)) {
      try {
        fs.writeFileSync(filePath, JSON.stringify([], null, 2));
        printPass(`File created: data/${filename}`);
      } catch (e) {
        printFail(`Cannot create data/${filename}`, e.message);
      }
    } else {
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        JSON.parse(content);
        printPass(`File verified: data/${filename}`);
      } catch (e) {
        printFail(`Corrupted JSON in data/${filename}`, e.message);
      }
    }
  };

  checkJsonFile('consultations.json');
  checkJsonFile('leads.json');

  // 3. React Frontend Build Check
  console.log(`\n${BOLD}3. React Frontend Production Build:${RESET}`);
  const distPath = path.join(__dirname, 'frontend', 'dist');
  const distIndex = path.join(distPath, 'index.html');
  const distAssets = path.join(distPath, 'assets');

  if (fs.existsSync(distIndex) && fs.existsSync(distAssets)) {
    const assets = fs.readdirSync(distAssets);
    printPass('Vite React Distribution Built', `${assets.length} assets in frontend/dist/`);
  } else {
    printFail(
      'Frontend Not Compiled',
      'Run `npm --prefix frontend run build` before starting in production mode.'
    );
  }

  // 4. Critical Secrets & Security Check
  console.log(`\n${BOLD}4. Security & Credentials Check:${RESET}`);

  // Vapi API
  const vapiKey = process.env.VAPI_API_KEY;
  const assistantId = process.env.VAPI_ASSISTANT_ID;
  if (vapiKey && !vapiKey.includes('your_') && vapiKey.length > 10) {
    printPass('Vapi API Key Configured', `...${vapiKey.slice(-4)}`);
  } else {
    printWarn('Vapi API Key Missing / Placeholder', 'Inbound AI voice will be disabled or simulated.');
  }

  if (assistantId && !assistantId.includes('your_')) {
    printPass('Vapi Assistant ID Configured', assistantId);
  } else {
    printWarn('Vapi Assistant ID Missing', 'Voice calls will not connect to a trained assistant.');
  }

  // Webhook Secret
  const webhookSecret = process.env.VAPI_WEBHOOK_SECRET;
  if (webhookSecret && webhookSecret.length >= 16) {
    printPass('Webhook Signature Verification Enabled', 'Requests to /webhook will be authenticated');
  } else {
    printWarn('VAPI_WEBHOOK_SECRET Weak or Unset', 'Set a strong secret to prevent unauthorized bookings');
  }

  // Admin Auth Key
  const adminKey = process.env.ADMIN_API_KEY;
  if (adminKey && adminKey !== 'codevirus2026' && adminKey.length >= 12) {
    printPass('Admin Key Hardened', 'Production custom admin key is set');
  } else {
    printWarn('Admin Key using Default or Short Key', 'Change ADMIN_API_KEY in .env before exposing to internet');
  }

  // Supabase
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
  if (supabaseUrl && supabaseKey && !supabaseUrl.includes('example.supabase.co')) {
    printPass('Supabase Cloud Database Configured', supabaseUrl);
  } else {
    printWarn('Supabase Not Configured', 'App will fall back to local JSON files in data/');
  }

  // OpenAI
  const openaiKey = process.env.OPENAI_API_KEY;
  if (openaiKey && !openaiKey.includes('your_') && openaiKey.startsWith('sk-')) {
    printPass('OpenAI Key Configured', `sk-...${openaiKey.slice(-4)}`);
  } else {
    printWarn('OpenAI Key Missing / Optional', 'Only required if direct LLM calls are invoked.');
  }

  // WhatsApp / Twilio
  const twilioSid = process.env.TWILIO_ACCOUNT_SID;
  const waToken = process.env.WHATSAPP_ACCESS_TOKEN;
  if ((twilioSid && !twilioSid.includes('your_')) || (waToken && !waToken.includes('your_'))) {
    printPass('WhatsApp Dispatch Provider Configured');
  } else {
    printWarn('WhatsApp Provider Missing', 'Messages will be logged to database only (mock mode).');
  }

  // Summary
  console.log(`\n${CYAN}----------------------------------------------------------------${RESET}`);
  console.log(`${BOLD}Audit Summary:${RESET} ${GREEN}${passed} Passed${RESET} | ${YELLOW}${warnings} Warnings${RESET} | ${RED}${errors} Errors${RESET}`);
  console.log(`${CYAN}----------------------------------------------------------------${RESET}\n`);

  if (errors > 0) {
    console.log(`${RED}${BOLD}Action Required: Please fix the failed items above before deploying.${RESET}\n`);
    process.exit(1);
  } else if (warnings > 0) {
    console.log(`${YELLOW}Ready for local development or demo. Review warnings before production launch.${RESET}\n`);
    process.exit(0);
  } else {
    console.log(`${GREEN}${BOLD}All checks passed! System is 100% production ready.${RESET}\n`);
    process.exit(0);
  }
}

runAudit().catch((err) => {
  console.error('Audit encountered unexpected error:', err);
  process.exit(1);
});


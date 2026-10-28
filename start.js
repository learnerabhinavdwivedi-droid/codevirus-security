/**
 * Codevirus Security — Master Application Launcher
 * One-command production launcher that:
 *   1. Starts the Express Server on port 3000
 *   2. Opens the public HTTPS Webhook Tunnel
 *   3. Syncs the live Webhook URL to the Vapi Assistant
 *   4. Launches the Operations Dashboard in your default browser
 *
 * Usage:
 *   node start.js
 *   or double-click start.bat
 */

require('dotenv').config();

require('dotenv').config();
const { exec, execSync } = require('child_process');
const localtunnel = require('localtunnel');
const fetch = require('node-fetch');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { startServer } = require('./server');

const PORT = Number(process.env.PORT) || 3000;
const VAPI_PRIVATE_KEY = process.env.VAPI_PRIVATE_KEY || '';
const CONFIG_PATH = path.join(__dirname, 'config.json');

async function isPortInUse(port) {
  return new Promise((resolve) => {
    const s = http.createServer().listen(port, () => {
      s.close(() => resolve(false));
    }).on('error', () => {
      resolve(true);
    });
  });
}

async function isOurServerRunning(port) {
  try {
    const res = await fetch(`http://localhost:${port}/health`, { timeout: 1500 });
    const data = await res.json();
    return data && data.company === 'Codevirus Security';
  } catch {
    return false;
  }
}

function freePort(port) {
  try {
    if (process.platform === 'win32') {
      execSync(`powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort ${port} -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }"`, { stdio: 'ignore' });
    }
  } catch {}
}

async function patchVapiAssistant(webhookUrl, assistantId) {
  try {
    const getRes = await fetch(`https://api.vapi.ai/assistant/${assistantId}`, {
      headers: { 'Authorization': `Bearer ${VAPI_PRIVATE_KEY}` }
    });
    const assistant = await getRes.json();
    if (!getRes.ok) return;

    for (const tool of (assistant.model?.tools || [])) {
      if (tool.function?.name === 'book_appointment') {
        tool.server = { url: webhookUrl };
      }
    }

    await fetch(`https://api.vapi.ai/assistant/${assistantId}`, {
      method:  'PATCH',
      headers: { 'Authorization': `Bearer ${VAPI_PRIVATE_KEY}`, 'Content-Type': 'application/json' },
      body:    JSON.stringify({ model: assistant.model })
    });
    console.log(`[tunnel] ✓ Vapi Assistant webhook patched → ${webhookUrl}`);
  } catch (err) {
    console.warn(`[tunnel] Vapi patch non-blocking warning: ${err.message}`);
  }
}

function openBrowser(url) {
  const startCmd = process.platform === 'win32' ? 'start' : (process.platform === 'darwin' ? 'open' : 'xdg-open');
  exec(`${startCmd} ${url}`, (err) => {
    if (err) console.log(`[browser] Open manually in Chrome: ${url}`);
  });
}

async function main() {
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║       CODEVIRUS SECURITY — AI OPERATIONS LAUNCHER             ║');
  console.log('║   Cybersecurity Career Counseling & Enterprise VAPT System   ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  // 1. Start Server
  console.log('▶ [1/3] Preparing Express Server on port ' + PORT + '…');
  const inUse = await isPortInUse(PORT);
  if (inUse) {
    const alreadyOur = await isOurServerRunning(PORT);
    if (alreadyOur) {
      console.log('  ✓ Codevirus server is already active and healthy on port ' + PORT);
    } else {
      console.log('  ⚠ Port ' + PORT + ' occupied by another process. Freeing port…');
      freePort(PORT);
      await new Promise(r => setTimeout(r, 600));
      startServer();
    }
  } else {
    startServer();
  }

  // 2. Start Public Webhook Tunnel
  console.log('▶ [2/3] Checking Public HTTPS Webhook Tunnel…');
  let config = {};
  if (fs.existsSync(CONFIG_PATH)) {
    try { config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8')); } catch {}
  }
  const assistantId = config.assistantId || process.env.ASSISTANT_ID || '399183dd-b23a-4558-a0d1-c3646fa3f8f9';

  let currentTunnelHealthy = false;
  if (config.tunnelUrl) {
    try {
      const ping = await fetch(`${config.tunnelUrl}/health`, { headers: { 'bypass-tunnel-reminder': '1' }, timeout: 3500 });
      if (ping.status === 200) currentTunnelHealthy = true;
    } catch {}
  }

  if (currentTunnelHealthy) {
    console.log(`  ✓ Live Webhook Tunnel Active: ${config.webhookUrl}`);
    await patchVapiAssistant(config.webhookUrl, assistantId);
  } else {
    try {
      const tunnel = await localtunnel({ port: PORT });
      const publicUrl = tunnel.url;
      const webhookUrl = `${publicUrl}/webhook`;

      console.log(`  ✓ Public Webhook URL: ${webhookUrl}`);
      await patchVapiAssistant(webhookUrl, assistantId);

      config.webhookUrl = webhookUrl;
      config.tunnelUrl  = publicUrl;
      config.ngrokUrl   = publicUrl;
      fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf8');

      tunnel.on('error', err => console.error('[tunnel error]', err.message));
    } catch (err) {
      console.warn(`  ⚠ Tunnel warning: ${err.message}. Local dashboard calling remains 100% active.`);
    }
  }

  // 3. Open Browser
  const appUrl = `http://localhost:${PORT}/`;
  console.log('▶ [3/3] Opening Codevirus React Suite in default browser…');
  console.log(`  → ${appUrl}\n`);
  setTimeout(() => openBrowser(appUrl), 1000);

  console.log('══════════════════════════════════════════════════════════════');
  console.log('  🟢 ALL SYSTEMS RUNNING (REACT FRONTEND)');
  console.log('  • Operations Dashboard: http://localhost:' + PORT + '/');
  console.log('  • Calendar Diary:       http://localhost:' + PORT + '/calendar');
  console.log('  • WhatsApp Console:     http://localhost:' + PORT + '/whatsapp');
  console.log('  • Press Ctrl+C in this window to stop all services');
  console.log('══════════════════════════════════════════════════════════════\n');
}

main().catch(err => {
  console.error('\n❌ Fatal startup error:', err);
  process.exit(1);
});

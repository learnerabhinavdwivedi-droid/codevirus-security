/**
 * Codevirus Security — Self-Healing Webhook Tunnel
 * Automatically establishes a public HTTPS tunnel, verifies live end-to-end connectivity,
 * syncs the webhook URL to the Vapi Assistant, and continuously monitors health with auto-reconnect.
 *
 * Usage: node tunnel.js
 */

require('dotenv').config();
const localtunnel = require('localtunnel');
const fetch       = require('node-fetch');
const fs          = require('fs');
const path        = require('path');

const PORT             = Number(process.env.PORT) || 3000;
const VAPI_PRIVATE_KEY = process.env.VAPI_PRIVATE_KEY || '';
const CONFIG_PATH      = path.join(__dirname, 'config.json');

process.on('uncaughtException', (err) => console.error('[tunnel] Uncaught exception:', err.message));
process.on('unhandledRejection', (reason) => console.warn('[tunnel] Unhandled rejection:', reason));

function loadConfig() {
  let cfg = {};
  if (fs.existsSync(CONFIG_PATH)) {
    try { cfg = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8')); } catch {}
  }
  return cfg;
}

function saveConfig(updates) {
  const cfg = { ...loadConfig(), ...updates };
  try {
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(cfg, null, 2), 'utf8');
  } catch (err) {
    console.error('[tunnel] Error saving config.json:', err.message);
  }
}

async function patchVapiWebhook(webhookUrl, assistantId) {
  console.log(`▶ Syncing webhook URL to Vapi assistant (${assistantId})…`);
  const getRes = await fetch(`https://api.vapi.ai/assistant/${assistantId}`, {
    headers: { 'Authorization': `Bearer ${VAPI_PRIVATE_KEY}` }
  });
  const assistant = await getRes.json();
  if (!getRes.ok) throw new Error('Failed to fetch assistant: ' + JSON.stringify(assistant));

  for (const tool of (assistant.model?.tools || [])) {
    if (tool.function?.name === 'book_appointment') {
      tool.server = { url: webhookUrl };
    }
  }

  const patchRes = await fetch(`https://api.vapi.ai/assistant/${assistantId}`, {
    method:  'PATCH',
    headers: { 'Authorization': `Bearer ${VAPI_PRIVATE_KEY}`, 'Content-Type': 'application/json' },
    body:    JSON.stringify({ model: assistant.model })
  });
  if (!patchRes.ok) throw new Error('Failed to patch Vapi assistant tools');
  console.log(`  ✓ Vapi assistant webhook updated → ${webhookUrl}`);
}

async function verifyTunnelHealth(url) {
  try {
    const res = await fetch(`${url}/health`, {
      headers: { 'bypass-tunnel-reminder': '1' },
      timeout: 4500
    });
    return res.status === 200;
  } catch {
    return false;
  }
}

let activeTunnel = null;
let watchdogInterval = null;

async function startHealthyTunnel(assistantId) {
  if (activeTunnel) {
    try { activeTunnel.close(); } catch {}
    activeTunnel = null;
  }

  console.log(`\n▶ [tunnel] Establishing fresh HTTPS tunnel on port ${PORT}…`);
  let attempts = 0;
  while (attempts < 5) {
    attempts++;
    try {
      const tunnel = await localtunnel({ port: PORT });
      const publicUrl = tunnel.url;
      const isHealthy = await verifyTunnelHealth(publicUrl);

      if (isHealthy) {
        activeTunnel = tunnel;
        const webhookUrl = `${publicUrl}/webhook`;
        console.log(`  ✓ Live & Verified Tunnel URL: ${publicUrl}`);
        console.log(`  ✓ Live Webhook Endpoint:    ${webhookUrl}`);

        await patchVapiWebhook(webhookUrl, assistantId);
        saveConfig({
          webhookUrl,
          tunnelUrl: publicUrl,
          ngrokUrl: publicUrl
        });

        tunnel.on('close', () => {
          console.warn('[tunnel] Tunnel connection closed. Triggering reconnect…');
          reconnect(assistantId);
        });

        tunnel.on('error', (err) => {
          console.error('[tunnel] Tunnel error:', err.message);
          reconnect(assistantId);
        });

        return publicUrl;
      } else {
        console.warn(`  ⚠ Tunnel ${publicUrl} returned 408/stale. Retrying (${attempts}/5)…`);
        try { tunnel.close(); } catch {}
        await new Promise(r => setTimeout(r, 1000));
      }
    } catch (err) {
      console.warn(`  ⚠ Attempt ${attempts} failed: ${err.message}`);
      await new Promise(r => setTimeout(r, 1200));
    }
  }

  throw new Error('Could not establish healthy tunnel after 5 attempts');
}

let isReconnecting = false;
async function reconnect(assistantId) {
  if (isReconnecting) return;
  isReconnecting = true;
  try {
    await startHealthyTunnel(assistantId);
  } catch (err) {
    console.error('[tunnel] Auto-reconnect failed:', err.message);
  } finally {
    isReconnecting = false;
  }
}

function startWatchdog(assistantId) {
  if (watchdogInterval) clearInterval(watchdogInterval);
  let failedChecks = 0;

  watchdogInterval = setInterval(async () => {
    if (isReconnecting || !activeTunnel) return;
    const ok = await verifyTunnelHealth(activeTunnel.url);
    if (!ok) {
      failedChecks++;
      console.warn(`[watchdog] Health check missed (${failedChecks}/2) on ${activeTunnel.url}`);
      if (failedChecks >= 2) {
        console.warn('[watchdog] Tunnel unresponsive (e.g. 408). Auto-healing tunnel…');
        failedChecks = 0;
        reconnect(assistantId);
      }
    } else {
      failedChecks = 0;
    }
  }, 20000);
}

async function main() {
  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║  Codevirus Security — Self-Healing Webhook Tunnel        ║');
  console.log('╚══════════════════════════════════════════════════════════╝');

  const config = loadConfig();
  const assistantId = config.assistantId || process.env.ASSISTANT_ID || '399183dd-b23a-4558-a0d1-c3646fa3f8f9';

  await startHealthyTunnel(assistantId);
  startWatchdog(assistantId);

  console.log('\n🟢 Tunnel is ACTIVE, VERIFIED, and HEALTH-CHECKED.');
  console.log('Keep this process running.\n');
}

main().catch(err => {
  console.error('\n❌ Fatal tunnel startup error:', err.message);
  process.exit(1);
});

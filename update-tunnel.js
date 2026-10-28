/**
 * Codevirus Security — update-tunnel.js
 * Reads the active ngrok HTTPS tunnel and patches the Vapi assistant's webhook URL.
 * Usage:
 *   1. ngrok http 3000
 *   2. node update-tunnel.js
 */

require('dotenv').config();
const fetch = require('node-fetch');
const fs    = require('fs');
const path  = require('path');

const VAPI_PRIVATE_KEY = process.env.VAPI_PRIVATE_KEY || '';
const CONFIG_PATH      = path.join(__dirname, 'config.json');

async function getNgrokUrl() {
  const res  = await fetch('http://localhost:4040/api/tunnels');
  const data = await res.json();
  const https = (data.tunnels || []).find(t => t.proto === 'https');
  if (!https) throw new Error('No HTTPS tunnel found — is `ngrok http 3000` running?');
  return https.public_url;
}

async function main() {
  let config = {};
  if (fs.existsSync(CONFIG_PATH)) {
    try { config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8')); } catch {}
  }
  const assistantId = config.assistantId || process.env.ASSISTANT_ID || '399183dd-b23a-4558-a0d1-c3646fa3f8f9';

  console.log('▶ Reading ngrok tunnel URL…');
  const ngrokUrl   = await getNgrokUrl();
  const webhookUrl = `${ngrokUrl}/webhook`;
  console.log('  ✓ Webhook URL:', webhookUrl);

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
  if (!patchRes.ok) throw new Error('Failed to patch Vapi webhook URL');

  config.webhookUrl = webhookUrl;
  config.ngrokUrl   = ngrokUrl;
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
  console.log('  ✓ Vapi assistant & config.json updated with new tunnel URL!\n');
}

main().catch(err => {
  console.error('\n✗ Tunnel update failed:', err.message);
  process.exit(1);
});

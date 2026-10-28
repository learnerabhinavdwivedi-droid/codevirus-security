/**
 * Codevirus Security — Windows Background Service Installer / Runner
 * Enables running Codevirus AI Suite automatically on Windows system boot.
 *
 * Requirements for native Windows Service installation:
 *   npm install node-windows
 *
 * Run:
 *   node windows-service.js install
 *   node windows-service.js uninstall
 */

const path = require('path');

const action = process.argv[2] || 'status';

if (action === 'status') {
  console.log(`\n╔══════════════════════════════════════════════════════╗`);
  console.log(`║  Codevirus Security — Windows Service Manager        ║`);
  console.log(`╠══════════════════════════════════════════════════════╣`);
  console.log(`║  Available commands:                                 ║`);
  console.log(`║    node windows-service.js install                   ║`);
  console.log(`║    node windows-service.js uninstall                 ║`);
  console.log(`║                                                      ║`);
  console.log(`║  Alternative (Recommended via PM2):                  ║`);
  console.log(`║    npm install -g pm2 pm2-windows-service            ║`);
  console.log(`║    pm2 start ecosystem.config.js                     ║`);
  console.log(`║    pm2 save                                          ║`);
  console.log(`╚══════════════════════════════════════════════════════╝\n`);
  process.exit(0);
}

let Service;
try {
  Service = require('node-windows').Service;
} catch (e) {
  console.log('\n[windows-service] "node-windows" is not installed.');
  console.log('To install Codevirus as a native Windows service, run:');
  console.log('  npm install -g pm2 pm2-windows-service');
  console.log('  pm2 start ecosystem.config.js');
  console.log('  pm2 save\n');
  process.exit(0);
}

const svc = new Service({
  name: 'Codevirus Security AI Suite',
  description: 'Enterprise AI Voice Receptionist, VAPT Booking & WhatsApp CRM for Codevirus Security',
  script: path.join(__dirname, 'server.js'),
  nodeOptions: [
    '--harmony',
    '--max_old_space_size=512'
  ]
});

if (action === 'install') {
  svc.on('install', () => {
    console.log('[windows-service] ✓ Service installed successfully. Starting service...');
    svc.start();
  });
  svc.install();
} else if (action === 'uninstall') {
  svc.on('uninstall', () => {
    console.log('[windows-service] ✓ Service uninstalled successfully.');
  });
  svc.uninstall();
}

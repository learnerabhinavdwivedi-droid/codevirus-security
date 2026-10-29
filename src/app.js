/**
 * Codevirus Security — Express Application Orchestrator
 */

const express = require('express');
const path = require('path');
const fs = require('fs');

const { PORT, ROOT_DIR, getConfig } = require('./config');
const {
  helmetMiddleware,
  corsMiddleware,
  generalLimiter
} = require('./middleware/security');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');
const routes = require('./routes');
const { startScheduledJobs } = require('./jobs/scheduler');
const { refreshAssistantDate } = require('./services/telephonyService');

// Crash Protection
process.on('uncaughtException', (err) => {
  console.error('[FATAL] Uncaught Exception:', err.stack || err);
});
process.on('unhandledRejection', (reason, promise) => {
  console.warn('[WARN] Unhandled Rejection at:', promise, 'reason:', reason);
});

const app = express();

// 1. Security & Body Parsers
app.use(helmetMiddleware);
app.use(corsMiddleware);
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// 2. Global API Rate Limiter
app.use('/api/', generalLimiter);

// 3. Protected Static Resource Guard & Dist Asset Serving
const FRONTEND_DIST = path.join(ROOT_DIR, 'frontend', 'dist');

app.use((req, res, next) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') return next();

  const cleanPath = req.path.replace(/^\/+/, '');
  if (!cleanPath) return next();

  // Serve Vite-built React assets (/assets/*)
  if (cleanPath.startsWith('assets/')) {
    const assetFile = path.join(FRONTEND_DIST, cleanPath);
    if (fs.existsSync(assetFile)) {
      return res.sendFile(assetFile);
    }
  }

  // Serve root static assets from frontend/dist (logo, manifest, etc.)
  const distFile = path.join(FRONTEND_DIST, cleanPath);
  if (fs.existsSync(distFile) && fs.statSync(distFile).isFile()) {
    return res.sendFile(distFile);
  }

  // Block access to private files, dotfiles, or internal code
  if (
    cleanPath.startsWith('.') ||
    cleanPath.startsWith('data/') ||
    cleanPath.startsWith('node_modules/') ||
    cleanPath.startsWith('src/') ||
    /\.(env|json|js|sql|bat|sh|yml|yaml|md|lock|zip|tar|gz|bak)$/i.test(cleanPath)
  ) {
    return res.status(403).json({ error: 'Access forbidden: protected resource' });
  }

  next();
});

// 4. Mount Master Routes
app.use(routes);

// 5. 404 & Centralized Error Handling
app.use(notFoundHandler);
app.use(errorHandler);

// Server Starter
function startServer() {
  const server = app.listen(PORT, async () => {
    const config = getConfig();
    console.log(`\n╔══════════════════════════════════════════════════════╗`);
    console.log(`║  Codevirus Security — AI Calling & Lead Server       ║`);
    console.log(`╠══════════════════════════════════════════════════════╣`);
    console.log(`║  Listening on  http://localhost:${PORT}                 ║`);
    console.log(`║  React Dashboard: http://localhost:${PORT}/                   ║`);
    console.log(`║  React Calendar:  http://localhost:${PORT}/calendar           ║`);
    console.log(`║  React WhatsApp:  http://localhost:${PORT}/whatsapp           ║`);
    console.log(`╠══════════════════════════════════════════════════════╣`);
    if (config.assistantId) {
      console.log(`║  ✓ Assistant ID loaded from config.json              ║`);
      console.log(`║  ${config.assistantId.padEnd(52)}║`);
    } else {
      console.log(`║  ⚠ No config.json — run setup.js first               ║`);
    }
    console.log(`║  ✓ Auto follow-up cron active (48hr window)          ║`);
    console.log(`║  ✓ Lead extraction active (gpt-4o-mini, 5s)          ║`);
    console.log(`║  ✓ Lead poller active (demo_leads, every 5s)         ║`);
    console.log(`║  ✓ Local JSON Persistence Store active               ║`);
    console.log(`╚══════════════════════════════════════════════════════╝\n`);

    // Refresh Vapi assistant with IST date
    await refreshAssistantDate();

    // Start background cron jobs
    startScheduledJobs();
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`\n❌ Error: Port ${PORT} is already in use by another process.`);
      console.error(`To fix on Windows PowerShell, run:`);
      console.error(`  Stop-Process -Id (Get-NetTCPConnection -LocalPort ${PORT}).OwningProcess -Force\n`);
      process.exit(1);
    } else {
      console.error('Server error:', err);
    }
  });

  return server;
}

module.exports = {
  app,
  startServer
};

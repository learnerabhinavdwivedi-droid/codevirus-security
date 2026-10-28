/**
 * Codevirus Security — PM2 Enterprise Ecosystem Configuration
 * Manages 24/7 high-availability background services for Codevirus AI Operations Suite.
 *
 * Usage:
 *   npx pm2 start ecosystem.config.js
 *   npx pm2 save
 *   npx pm2 logs
 */

module.exports = {
  apps: [
    {
      name: 'codevirus-api-server',
      script: 'server.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: './data/logs/server-error.log',
      out_file: './data/logs/server-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
    },
    {
      name: 'codevirus-tunnel-watchdog',
      script: 'tunnel.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '300M',
      env: {
        NODE_ENV: 'production'
      },
      error_file: './data/logs/tunnel-error.log',
      out_file: './data/logs/tunnel-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
    }
  ]
};

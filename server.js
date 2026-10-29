/**
 * Codevirus Security — AI Calling & Lead Operations Server
 * Entry point delegating to modular application core in src/
 */

require('dotenv').config();
const { app, startServer } = require('./src/app');

if (require.main === module) {
  startServer();
}

module.exports = { app, startServer };

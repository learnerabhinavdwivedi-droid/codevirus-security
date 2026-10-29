/**
 * Codevirus Security — Authentication & Staff Session Routes
 */

const express = require('express');
const router = express.Router();
const { verifyStaffLogin } = require('../middleware/auth');
const { ADMIN_API_KEY } = require('../config');

router.post('/login', (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const authenticatedUser = verifyStaffLogin(email, password);
  if (!authenticatedUser) {
    return res.status(401).json({ error: 'Invalid counselor credentials' });
  }

  return res.json({
    success: true,
    user: {
      name: authenticatedUser.name,
      email: authenticatedUser.email,
      role: authenticatedUser.role
    },
    token: ADMIN_API_KEY || 'session_token_authorized_2026'
  });
});

router.get('/me', (req, res) => {
  const authHeader = req.headers['authorization'];
  const bearerToken = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  const provided = req.headers['x-api-key'] || req.query.api_key || bearerToken;

  if (ADMIN_API_KEY && provided !== ADMIN_API_KEY) {
    return res.status(401).json({ authenticated: false });
  }

  return res.json({
    authenticated: true,
    user: { name: 'Ankit Rai', role: 'Director', email: 'admin@codevirussec.in' }
  });
});

module.exports = router;

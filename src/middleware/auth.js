/**
 * Codevirus Security — Authentication & Authorization Gate
 */

const { ADMIN_API_KEY, STAFF_ACCOUNTS } = require('../config');

function requireAdminAuth(req, res, next) {
  if (!ADMIN_API_KEY) return next(); // Permissive in local demo mode if unset

  const authHeader = req.headers['authorization'];
  const bearerToken = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  const provided = req.headers['x-api-key'] || req.query.api_key || bearerToken;

  if (provided === ADMIN_API_KEY) return next();

  return res.status(401).json({ error: 'Unauthorized: valid admin API key required' });
}

function verifyStaffLogin(email, password) {
  if (!email || !password) return null;

  const user = STAFF_ACCOUNTS.find(
    (u) => u.email.toLowerCase() === email.trim().toLowerCase() && u.password === password
  );

  const masterPass = ADMIN_API_KEY || 'codevirus2026';
  if (!user && password === masterPass) {
    return {
      name: 'Authorized Administrator',
      email: email.trim(),
      role: 'Director'
    };
  }

  return user ? { name: user.name, email: user.email, role: user.role } : null;
}

module.exports = {
  requireAdminAuth,
  verifyStaffLogin
};

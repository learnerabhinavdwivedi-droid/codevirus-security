/**
 * Codevirus Security — Centralized Error & 404 Handlers
 */

function notFoundHandler(_req, res) {
  res.status(404).json({ error: 'Endpoint or resource not found' });
}

function errorHandler(err, _req, res, _next) {
  console.error('[SERVER ERROR]', err.stack || err.message || err);
  const isProd = process.env.NODE_ENV === 'production';
  res.status(err.status || 500).json({
    error: isProd ? 'Internal server error' : (err.message || 'Internal server error'),
    ...(isProd ? {} : { stack: err.stack })
  });
}

module.exports = {
  notFoundHandler,
  errorHandler
};

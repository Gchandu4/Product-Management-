const errorHandler = (err, _req, res, _next) => {
  console.error(`[ERROR] ${err.message}`);
  if (err.code === '23505') return res.status(409).json({ error: 'That value already exists.' });
  if (err.code === '23503') return res.status(400).json({ error: 'Referenced record not found.' });
  const status = err.status || err.statusCode || 500;
  res.status(status).json({ error: err.message || 'Internal server error.' });
};

module.exports = { errorHandler };

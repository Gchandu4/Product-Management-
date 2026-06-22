const { Pool } = require('pg');

// Render provides DATABASE_URL — use it directly when available
const pool = new Pool(
  process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }, // required for Render PostgreSQL
      }
    : {
        host:     process.env.DB_HOST || 'localhost',
        port:     parseInt(process.env.DB_PORT || '5432'),
        database: process.env.DB_NAME || 'carevale_db',
        user:     process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || '',
        ssl: false,
      }
);

pool.on('error', (err) => console.error('DB pool error:', err.message));

const query = (text, params) => pool.query(text, params);

module.exports = { pool, query };

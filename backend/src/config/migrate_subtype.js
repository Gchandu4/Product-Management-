require('dotenv').config();
const { pool } = require('./db');

const migrate = async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(`
      ALTER TABLE products
      ADD COLUMN IF NOT EXISTS sub_type VARCHAR(150);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_products_sub_type ON products(sub_type);
    `);

    await client.query('COMMIT');
    console.log('✓ Migration complete — added sub_type column to products');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    pool.end();
  }
};

migrate();

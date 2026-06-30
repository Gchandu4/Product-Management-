require('dotenv').config();
const { pool } = require('./db');

const migrate = async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Drop the old simple text column from the previous migration (if it exists)
    await client.query(`ALTER TABLE products DROP COLUMN IF EXISTS sub_type;`);

    // New table: each row is one component/sub-type that belongs to a parent product
    await client.query(`
      CREATE TABLE IF NOT EXISTS product_subtypes (
        id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        product_id    UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        name          VARCHAR(150) NOT NULL,
        sub_code      VARCHAR(50),
        unit_cost     NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (unit_cost >= 0),
        quantity      INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
        sort_order    INTEGER NOT NULL DEFAULT 0,
        created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await client.query(`CREATE INDEX IF NOT EXISTS idx_subtypes_product ON product_subtypes(product_id);`);

    // Auto-update trigger (reuses the set_updated_at() function created in migrate.js)
    await client.query(`
      DROP TRIGGER IF EXISTS trg_subtypes_updated ON product_subtypes;
      CREATE TRIGGER trg_subtypes_updated
        BEFORE UPDATE ON product_subtypes
        FOR EACH ROW EXECUTE FUNCTION set_updated_at();
    `);

    // Mark parent products as assemblies once they have sub-types.
    // The parent's own quantity/cost will now be DERIVED (computed by the API),
    // but we keep the columns so non-assembly products still work standalone.
    await client.query(`
      ALTER TABLE products ADD COLUMN IF NOT EXISTS is_assembly BOOLEAN NOT NULL DEFAULT false;
    `);

    await client.query('COMMIT');
    console.log('✓ Migration complete — product_subtypes table created, is_assembly flag added');
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

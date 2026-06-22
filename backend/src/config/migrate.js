require('dotenv').config();
const { pool } = require('./db');

const migrate = async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Users
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name        VARCHAR(100) NOT NULL,
        email       VARCHAR(255) UNIQUE NOT NULL,
        password    VARCHAR(255) NOT NULL,
        role        VARCHAR(20)  NOT NULL DEFAULT 'staff'
                    CHECK (role IN ('admin','staff','viewer')),
        is_active   BOOLEAN NOT NULL DEFAULT true,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // Categories
    await client.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name        VARCHAR(100) UNIQUE NOT NULL,
        color       VARCHAR(20)  NOT NULL DEFAULT '#239b8b',
        description TEXT,
        is_active   BOOLEAN NOT NULL DEFAULT true,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // Products
    await client.query(`
      CREATE TABLE IF NOT EXISTS products (
        id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        serial_no     SERIAL,
        product_name  VARCHAR(200) NOT NULL,
        product_id    VARCHAR(50)  UNIQUE NOT NULL,
        product_cost  NUMERIC(12,2) NOT NULL CHECK (product_cost >= 0),
        quantity      INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
        category      VARCHAR(100),
        description   TEXT,
        image_url     TEXT,
        is_active     BOOLEAN NOT NULL DEFAULT true,
        created_by    UUID REFERENCES users(id),
        updated_by    UUID REFERENCES users(id),
        created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // Stock adjustments
    await client.query(`
      CREATE TABLE IF NOT EXISTS stock_adjustments (
        id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        product_id      UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        adjusted_by     UUID REFERENCES users(id),
        type            VARCHAR(20) NOT NULL
                        CHECK (type IN ('add','remove','set','sale','purchase','damage','return')),
        quantity_before INTEGER NOT NULL,
        quantity_change INTEGER NOT NULL,
        quantity_after  INTEGER NOT NULL,
        note            TEXT,
        created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // Indexes
    await client.query(`CREATE INDEX IF NOT EXISTS idx_products_product_id ON products(product_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_products_active     ON products(is_active);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_products_category   ON products(category);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_stock_product       ON stock_adjustments(product_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_stock_created       ON stock_adjustments(created_at DESC);`);

    // Auto-update trigger
    await client.query(`
      CREATE OR REPLACE FUNCTION set_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
      $$ LANGUAGE plpgsql;
    `);
    for (const tbl of ['users','products','categories']) {
      await client.query(`
        DROP TRIGGER IF EXISTS trg_${tbl}_updated ON ${tbl};
        CREATE TRIGGER trg_${tbl}_updated
          BEFORE UPDATE ON ${tbl}
          FOR EACH ROW EXECUTE FUNCTION set_updated_at();
      `);
    }

    await client.query('COMMIT');
    console.log('✓ Migration complete');
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

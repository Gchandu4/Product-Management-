// Runs every migration file in order. Each migration uses
// "CREATE TABLE IF NOT EXISTS" / "ADD COLUMN IF NOT EXISTS" etc.,
// so running this repeatedly on every deploy is always safe.
require('dotenv').config();
const { pool } = require('./db');

const run = async (label, fn) => {
  try {
    await fn();
    console.log(`✓ ${label}`);
  } catch (err) {
    console.error(`✗ ${label} —`, err.message);
  }
};

const main = async () => {
  const client = await pool.connect();

  // ── Base tables (users, products, categories, stock_adjustments) ──────────
  await run('Base tables', async () => {
    await client.query('BEGIN');
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(100) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(20) NOT NULL DEFAULT 'staff' CHECK (role IN ('admin','staff','viewer')),
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(100) UNIQUE NOT NULL,
        color VARCHAR(20) NOT NULL DEFAULT '#239b8b',
        description TEXT,
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS products (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        serial_no SERIAL,
        product_name VARCHAR(200) NOT NULL,
        product_id VARCHAR(50) UNIQUE NOT NULL,
        product_cost NUMERIC(12,2) NOT NULL CHECK (product_cost >= 0),
        quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
        category VARCHAR(100),
        description TEXT,
        image_url TEXT,
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_by UUID REFERENCES users(id),
        updated_by UUID REFERENCES users(id),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS stock_adjustments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        adjusted_by UUID REFERENCES users(id),
        type VARCHAR(20) NOT NULL CHECK (type IN ('add','remove','set','sale','purchase','damage','return')),
        quantity_before INTEGER NOT NULL,
        quantity_change INTEGER NOT NULL,
        quantity_after INTEGER NOT NULL,
        note TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_products_product_id ON products(product_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_stock_product ON stock_adjustments(product_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_stock_created ON stock_adjustments(created_at DESC);`);
    await client.query(`
      CREATE OR REPLACE FUNCTION set_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
      $$ LANGUAGE plpgsql;
    `);
    for (const tbl of ['users','products','categories']) {
      await client.query(`
        DROP TRIGGER IF EXISTS trg_${tbl}_updated ON ${tbl};
        CREATE TRIGGER trg_${tbl}_updated BEFORE UPDATE ON ${tbl}
        FOR EACH ROW EXECUTE FUNCTION set_updated_at();
      `);
    }
    await client.query('COMMIT');
  });

  // ── Sub-types (component/assembly model) ───────────────────────────────────
  await run('Sub-types table', async () => {
    await client.query('BEGIN');
    await client.query(`ALTER TABLE products DROP COLUMN IF EXISTS sub_type;`);
    await client.query(`
      CREATE TABLE IF NOT EXISTS product_subtypes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        name VARCHAR(150) NOT NULL,
        sub_code VARCHAR(50),
        unit_cost NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (unit_cost >= 0),
        quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
        sort_order INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_subtypes_product ON product_subtypes(product_id);`);
    await client.query(`
      DROP TRIGGER IF EXISTS trg_subtypes_updated ON product_subtypes;
      CREATE TRIGGER trg_subtypes_updated BEFORE UPDATE ON product_subtypes
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
    `);
    await client.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS is_assembly BOOLEAN NOT NULL DEFAULT false;`);
    await client.query('COMMIT');
  });

  // ── Sale requests (Reception → Admin approval workflow) ────────────────────
  await run('Sale requests table + reception role', async () => {
    await client.query('BEGIN');

    // Allow 'reception' as a valid role
    await client.query(`ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;`);
    await client.query(`
      ALTER TABLE users ADD CONSTRAINT users_role_check
      CHECK (role IN ('admin','staff','viewer','reception'));
    `);

    await client.query(`CREATE SEQUENCE IF NOT EXISTS sale_request_seq START 1001;`);

    await client.query(`
      CREATE TABLE IF NOT EXISTS sale_requests (
        id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        request_no      VARCHAR(30) UNIQUE NOT NULL DEFAULT ('REQ-' || TO_CHAR(NOW(),'YYYY') || '-' || LPAD(nextval('sale_request_seq')::TEXT,4,'0')),
        product_id      UUID NOT NULL REFERENCES products(id),
        product_name    VARCHAR(200) NOT NULL,
        product_code    VARCHAR(50)  NOT NULL,
        quantity        INTEGER NOT NULL CHECK (quantity > 0),
        patient_name    VARCHAR(150),
        patient_phone   VARCHAR(20),
        reason          TEXT,
        status          VARCHAR(20) NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending','approved','rejected')),
        requested_by    UUID REFERENCES users(id),
        reviewed_by     UUID REFERENCES users(id),
        review_note     TEXT,
        requested_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        reviewed_at     TIMESTAMPTZ
      );
    `);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_sale_req_status ON sale_requests(status);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_sale_req_product ON sale_requests(product_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_sale_req_requested ON sale_requests(requested_at DESC);`);

    await client.query('COMMIT');
  });

  // ── Seed (only inserts if not already present — safe to repeat) ───────────
  await run('Seed default admin + sample data', async () => {
    const bcrypt = require('bcryptjs');
    await client.query('BEGIN');

    const cats = [
      ['Prosthetics','#239b8b','Prosthetic limb devices'],
      ['Orthotics','#185FA5','Orthotic support devices'],
      ['Diabetic Care','#d97706','Diabetic foot care products'],
      ['Custom Insole','#533AB7','Custom insoles and foot orthotics'],
      ['Paediatrics','#993556','Paediatric devices'],
      ['Rehabilitation','#16a34a','Rehabilitation equipment'],
      ['Other','#6B8FA3','Miscellaneous products'],
    ];
    for (const [name,color,description] of cats) {
      await client.query(
        `INSERT INTO categories (name,color,description) VALUES ($1,$2,$3) ON CONFLICT (name) DO NOTHING`,
        [name,color,description]
      );
    }

    const hash = await bcrypt.hash('CareVale@2026', 12);
    await client.query(`
      INSERT INTO users (name,email,password,role) VALUES ($1,$2,$3,'admin')
      ON CONFLICT (email) DO NOTHING
    `, ['CareVale Admin','admin@carevale.co.in', hash]);

    await client.query('COMMIT');
  });

  client.release();
  await pool.end();
  console.log('All migrations checked.');
};

main().catch(err => { console.error('Migration runner failed:', err); process.exit(1); });


require('dotenv').config();
const bcrypt = require('bcryptjs');
const { pool } = require('./db');

const seed = async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Categories
    const cats = [
      ['Prosthetics',    '#239b8b', 'Prosthetic limb devices'],
      ['Orthotics',      '#185FA5', 'Orthotic support devices'],
      ['Diabetic Care',  '#d97706', 'Diabetic foot care products'],
      ['Custom Insole',  '#533AB7', 'Custom insoles and foot orthotics'],
      ['Paediatrics',    '#993556', 'Paediatric devices'],
      ['Rehabilitation', '#16a34a', 'Rehabilitation equipment'],
      ['Other',          '#6B8FA3', 'Miscellaneous products'],
    ];
    for (const [name, color, description] of cats) {
      await client.query(
        `INSERT INTO categories (name,color,description) VALUES ($1,$2,$3) ON CONFLICT (name) DO NOTHING`,
        [name, color, description]
      );
    }

    // Admin user
    const hash = await bcrypt.hash('CareVale@2026', 12);
    await client.query(`
      INSERT INTO users (name,email,password,role)
      VALUES ($1,$2,$3,'admin') ON CONFLICT (email) DO NOTHING
    `, ['CareVale Admin', 'admin@carevale.co.in', hash]);

    const { rows: [admin] } = await client.query(
      `SELECT id FROM users WHERE email='admin@carevale.co.in'`
    );

    // Sample products
    const products = [
      ['Below-Knee Prosthetic (BK)',   'CV-PRO-001', 45000,  12, 'Prosthetics'],
      ['Above-Knee Prosthetic (AK)',   'CV-PRO-002', 72000,   5, 'Prosthetics'],
      ['Myoelectric Hand Prosthetic',  'CV-PRO-003', 185000,  2, 'Prosthetics'],
      ['KAFO Orthosis',                'CV-ORT-001', 18500,   8, 'Orthotics'],
      ['Ankle Foot Orthosis (AFO)',    'CV-ORT-002', 12000,  15, 'Orthotics'],
      ['Knee Orthosis (KO)',           'CV-ORT-003',  8500,  10, 'Orthotics'],
      ['Diabetic Insole (Pair)',        'CV-DFC-001',  2200,  34, 'Diabetic Care'],
      ['Custom Foot Orthosis',         'CV-INS-001',  3500,   3, 'Custom Insole'],
      ['Cranial Helmet (Paediatric)',  'CV-PED-001', 22000,   4, 'Paediatrics'],
      ['Dynamic AFO — Child',          'CV-PED-002',  9500,   6, 'Paediatrics'],
      ['Shoulder Orthosis',            'CV-ORT-004', 14000,   7, 'Orthotics'],
      ['Elbow Prosthetic',             'CV-PRO-004', 58000,   0, 'Prosthetics'],
    ];
    for (const [name, pid, cost, qty, cat] of products) {
      await client.query(`
        INSERT INTO products (product_name,product_id,product_cost,quantity,category,created_by,updated_by)
        VALUES ($1,$2,$3,$4,$5,$6,$6) ON CONFLICT (product_id) DO NOTHING
      `, [name, pid, cost, qty, cat, admin.id]);
    }

    await client.query('COMMIT');
    console.log('✓ Seed complete  |  Login: admin@carevale.co.in / CareVale@2026');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Seed failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    pool.end();
  }
};

seed();

const { query, pool } = require('../config/db');

const getHistory = async (req, res, next) => {
  try {
    const { product_id, limit = 100, page = 1 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const params = [];
    const conds  = [];
    if (product_id) { params.push(product_id); conds.push(`sa.product_id=$${params.length}`); }
    const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';
    const { rows } = await query(`
      SELECT sa.*, p.product_name, p.product_id AS pid, u.name AS adjusted_by_name
      FROM stock_adjustments sa
      JOIN products p ON p.id = sa.product_id
      LEFT JOIN users u ON u.id = sa.adjusted_by
      ${where} ORDER BY sa.created_at DESC
      LIMIT $${params.length+1} OFFSET $${params.length+2}
    `, [...params, parseInt(limit), offset]);
    const { rows: [{ count }] } = await query(
      `SELECT COUNT(*) FROM stock_adjustments sa ${where}`, params
    );
    res.json({ adjustments: rows, total: parseInt(count) });
  } catch (err) { next(err); }
};

const adjustStock = async (req, res, next) => {
  const client = await pool.connect();
  try {
    const { product_id, type, quantity_change, note } = req.body;
    if (!product_id || !type || quantity_change === undefined)
      return res.status(400).json({ error: 'product_id, type, quantity_change required.' });

    await client.query('BEGIN');
    const { rows: [product] } = await client.query(
      `SELECT id,quantity FROM products WHERE id=$1 AND is_active=true FOR UPDATE`, [product_id]
    );
    if (!product) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'Product not found.' }); }

    const before = product.quantity;
    let after;
    if (type === 'set') after = parseInt(quantity_change);
    else if (['remove','sale','damage'].includes(type)) after = before - Math.abs(parseInt(quantity_change));
    else after = before + Math.abs(parseInt(quantity_change));

    if (after < 0) { await client.query('ROLLBACK'); return res.status(400).json({ error: `Stock cannot go below 0. Current: ${before}.` }); }

    await client.query(`UPDATE products SET quantity=$1,updated_by=$2 WHERE id=$3`, [after, req.user.id, product_id]);
    const { rows: [adj] } = await client.query(`
      INSERT INTO stock_adjustments (product_id,adjusted_by,type,quantity_before,quantity_change,quantity_after,note)
      VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *
    `, [product_id, req.user.id, type, before, type==='set' ? after-before : parseInt(quantity_change), after, note||null]);

    await client.query('COMMIT');
    res.status(201).json(adj);
  } catch (err) { await client.query('ROLLBACK'); next(err); }
  finally { client.release(); }
};

const getSummary = async (req, res, next) => {
  try {
    const [byCategory, recentMovements, lowStock, topByValue] = await Promise.all([
      query(`SELECT category, COUNT(*) AS count, SUM(product_cost*quantity) AS total_value, SUM(quantity) AS total_qty
             FROM products WHERE is_active=true AND category IS NOT NULL GROUP BY category ORDER BY total_value DESC`),
      query(`SELECT DATE(created_at) AS day,
               SUM(CASE WHEN quantity_change>0 THEN quantity_change ELSE 0 END) AS added,
               SUM(CASE WHEN quantity_change<0 THEN ABS(quantity_change) ELSE 0 END) AS removed
             FROM stock_adjustments WHERE created_at >= NOW()-INTERVAL '7 days'
             GROUP BY DATE(created_at) ORDER BY day`),
      query(`SELECT id,product_name,product_id,quantity,category FROM products WHERE is_active=true AND quantity<=5 ORDER BY quantity ASC LIMIT 10`),
      query(`SELECT product_name,product_id,category, product_cost*quantity AS total_value,quantity FROM products WHERE is_active=true ORDER BY total_value DESC LIMIT 6`),
    ]);
    res.json({ byCategory: byCategory.rows, recentMovements: recentMovements.rows, lowStock: lowStock.rows, topByValue: topByValue.rows });
  } catch (err) { next(err); }
};

module.exports = { getHistory, adjustStock, getSummary };

const { query, pool } = require('../config/db');

// Recompute the parent product's quantity (= min component qty) and cost (= sum component costs)
// Called any time a sub-type row is added, edited, or deleted.
const recomputeParent = async (client, product_id) => {
  const { rows: subtypes } = await client.query(
    `SELECT quantity, unit_cost FROM product_subtypes WHERE product_id=$1`,
    [product_id]
  );

  if (subtypes.length === 0) {
    // No sub-types left — product reverts to standalone, leave its values as-is
    await client.query(`UPDATE products SET is_assembly=false WHERE id=$1`, [product_id]);
    return;
  }

  const minQty   = Math.min(...subtypes.map(s => s.quantity));
  const totalCost = subtypes.reduce((sum, s) => sum + parseFloat(s.unit_cost), 0);

  await client.query(
    `UPDATE products SET quantity=$1, product_cost=$2, is_assembly=true WHERE id=$3`,
    [minQty, totalCost.toFixed(2), product_id]
  );
};

// GET /api/products/:productId/subtypes
const getSubtypes = async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT * FROM product_subtypes WHERE product_id=$1 ORDER BY sort_order ASC, created_at ASC`,
      [req.params.productId]
    );
    res.json(rows);
  } catch (err) { next(err); }
};

// POST /api/products/:productId/subtypes  — add one component
const createSubtype = async (req, res, next) => {
  const client = await pool.connect();
  try {
    const { name, sub_code, unit_cost, quantity, sort_order } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: 'Sub-type name is required.' });

    await client.query('BEGIN');
    const { rows: [sub] } = await client.query(`
      INSERT INTO product_subtypes (product_id,name,sub_code,unit_cost,quantity,sort_order)
      VALUES ($1,$2,$3,$4,$5,$6) RETURNING *
    `, [req.params.productId, name.trim(), sub_code||null, unit_cost||0, quantity||0, sort_order||0]);

    await recomputeParent(client, req.params.productId);
    await client.query('COMMIT');

    const { rows: [product] } = await query(`SELECT * FROM products WHERE id=$1`, [req.params.productId]);
    res.status(201).json({ subtype: sub, product });
  } catch (err) { await client.query('ROLLBACK'); next(err); }
  finally { client.release(); }
};

// PUT /api/products/:productId/subtypes/:id  — edit one component
const updateSubtype = async (req, res, next) => {
  const client = await pool.connect();
  try {
    const { name, sub_code, unit_cost, quantity, sort_order } = req.body;
    await client.query('BEGIN');

    const { rows: [sub] } = await client.query(`
      UPDATE product_subtypes SET name=$1,sub_code=$2,unit_cost=$3,quantity=$4,sort_order=$5
      WHERE id=$6 AND product_id=$7 RETURNING *
    `, [name, sub_code||null, unit_cost||0, quantity||0, sort_order||0, req.params.id, req.params.productId]);

    if (!sub) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'Sub-type not found.' }); }

    await recomputeParent(client, req.params.productId);
    await client.query('COMMIT');

    const { rows: [product] } = await query(`SELECT * FROM products WHERE id=$1`, [req.params.productId]);
    res.json({ subtype: sub, product });
  } catch (err) { await client.query('ROLLBACK'); next(err); }
  finally { client.release(); }
};

// DELETE /api/products/:productId/subtypes/:id
const deleteSubtype = async (req, res, next) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(
      `DELETE FROM product_subtypes WHERE id=$1 AND product_id=$2 RETURNING id`,
      [req.params.id, req.params.productId]
    );
    if (!rows[0]) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'Sub-type not found.' }); }

    await recomputeParent(client, req.params.productId);
    await client.query('COMMIT');

    const { rows: [product] } = await query(`SELECT * FROM products WHERE id=$1`, [req.params.productId]);
    res.json({ message: 'Sub-type removed.', product });
  } catch (err) { await client.query('ROLLBACK'); next(err); }
  finally { client.release(); }
};

module.exports = { getSubtypes, createSubtype, updateSubtype, deleteSubtype, recomputeParent };

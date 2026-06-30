const { query, pool } = require('../config/db');

// GET /api/sale-requests — list with status filter
const getRequests = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 50 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const params = [];
    const conds  = [];

    // Reception/staff only see their own requests; admin sees all
    if (req.user.role !== 'admin') {
      params.push(req.user.id);
      conds.push(`sr.requested_by = $${params.length}`);
    }
    if (status) { params.push(status); conds.push(`sr.status = $${params.length}`); }

    const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';

    const { rows } = await query(`
      SELECT sr.*,
        p.quantity AS current_stock,
        ru.name AS requested_by_name,
        rv.name AS reviewed_by_name
      FROM sale_requests sr
      JOIN products p ON p.id = sr.product_id
      LEFT JOIN users ru ON ru.id = sr.requested_by
      LEFT JOIN users rv ON rv.id = sr.reviewed_by
      ${where}
      ORDER BY
        CASE sr.status WHEN 'pending' THEN 0 ELSE 1 END,
        sr.requested_at DESC
      LIMIT $${params.length+1} OFFSET $${params.length+2}
    `, [...params, parseInt(limit), offset]);

    const { rows: [{ count: pendingCount }] } = await query(
      `SELECT COUNT(*) FROM sale_requests WHERE status='pending'`
    );

    res.json({ requests: rows, pendingCount: parseInt(pendingCount) });
  } catch (err) { next(err); }
};

// POST /api/sale-requests — Reception/Staff create a request
const createRequest = async (req, res, next) => {
  try {
    const { product_id, quantity, patient_name, patient_phone, reason } = req.body;
    if (!product_id || !quantity || quantity <= 0)
      return res.status(400).json({ error: 'Product and a valid quantity are required.' });

    const { rows: [prod] } = await query(
      `SELECT product_name, product_id AS pid, quantity AS stock FROM products WHERE id=$1 AND is_active=true`,
      [product_id]
    );
    if (!prod) return res.status(404).json({ error: 'Product not found.' });
    if (prod.stock < quantity)
      return res.status(400).json({ error: `Only ${prod.stock} units available in stock.` });

    const { rows: [reqRow] } = await query(`
      INSERT INTO sale_requests (product_id,product_name,product_code,quantity,patient_name,patient_phone,reason,requested_by)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *
    `, [product_id, prod.product_name, prod.pid, quantity, patient_name||null, patient_phone||null, reason||null, req.user.id]);

    res.status(201).json(reqRow);
  } catch (err) { next(err); }
};

// PATCH /api/sale-requests/:id/approve — Admin only, deducts stock immediately
const approveRequest = async (req, res, next) => {
  const client = await pool.connect();
  try {
    const { review_note } = req.body;
    await client.query('BEGIN');

    const { rows: [reqRow] } = await client.query(
      `SELECT * FROM sale_requests WHERE id=$1 AND status='pending' FOR UPDATE`,
      [req.params.id]
    );
    if (!reqRow) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'Pending request not found.' }); }

    const { rows: [prod] } = await client.query(
      `SELECT quantity FROM products WHERE id=$1 FOR UPDATE`, [reqRow.product_id]
    );
    if (!prod || prod.quantity < reqRow.quantity) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: `Insufficient stock. Available: ${prod?.quantity ?? 0}, requested: ${reqRow.quantity}.` });
    }

    const newQty = prod.quantity - reqRow.quantity;
    await client.query(`UPDATE products SET quantity=$1, updated_by=$2 WHERE id=$3`, [newQty, req.user.id, reqRow.product_id]);

    await client.query(`
      INSERT INTO stock_adjustments (product_id,adjusted_by,type,quantity_before,quantity_change,quantity_after,note)
      VALUES ($1,$2,'sale',$3,$4,$5,$6)
    `, [reqRow.product_id, req.user.id, prod.quantity, -reqRow.quantity, newQty,
        `Approved request ${reqRow.request_no}${reqRow.patient_name ? ' — patient: '+reqRow.patient_name : ''}`]);

    const { rows: [updated] } = await client.query(`
      UPDATE sale_requests SET status='approved', reviewed_by=$1, review_note=$2, reviewed_at=NOW()
      WHERE id=$3 RETURNING *
    `, [req.user.id, review_note||null, req.params.id]);

    await client.query('COMMIT');
    res.json(updated);
  } catch (err) { await client.query('ROLLBACK'); next(err); }
  finally { client.release(); }
};

// PATCH /api/sale-requests/:id/reject — Admin only, no stock change
const rejectRequest = async (req, res, next) => {
  try {
    const { review_note } = req.body;
    const { rows: [updated] } = await query(`
      UPDATE sale_requests SET status='rejected', reviewed_by=$1, review_note=$2, reviewed_at=NOW()
      WHERE id=$3 AND status='pending' RETURNING *
    `, [req.user.id, review_note||null, req.params.id]);
    if (!updated) return res.status(404).json({ error: 'Pending request not found.' });
    res.json(updated);
  } catch (err) { next(err); }
};

module.exports = { getRequests, createRequest, approveRequest, rejectRequest };

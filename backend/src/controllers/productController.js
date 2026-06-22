const { query } = require('../config/db');

const getProducts = async (req, res, next) => {
  try {
    const { search, category, low_stock, page = 1, limit = 100 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const params = [];
    const conds  = ['p.is_active = true'];

    if (search) {
      params.push(`%${search}%`);
      conds.push(`(p.product_name ILIKE $${params.length} OR p.product_id ILIKE $${params.length})`);
    }
    if (category) { params.push(category); conds.push(`p.category = $${params.length}`); }
    if (low_stock === 'true') conds.push(`p.quantity <= 5`);

    const where = `WHERE ${conds.join(' AND ')}`;
    const { rows } = await query(`
      SELECT p.*, u.name AS created_by_name
      FROM products p LEFT JOIN users u ON u.id = p.created_by
      ${where} ORDER BY p.serial_no ASC
      LIMIT $${params.length+1} OFFSET $${params.length+2}
    `, [...params, parseInt(limit), offset]);

    const { rows: [{ count }] } = await query(
      `SELECT COUNT(*) FROM products p ${where}`, params
    );
    res.json({ products: rows, total: parseInt(count), page: parseInt(page), limit: parseInt(limit) });
  } catch (err) { next(err); }
};

const getProduct = async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT * FROM products WHERE id=$1 AND is_active=true`, [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Product not found.' });
    res.json(rows[0]);
  } catch (err) { next(err); }
};

const createProduct = async (req, res, next) => {
  try {
    const { product_name, product_id, product_cost, quantity, category, description } = req.body;
    const { rows } = await query(`
      INSERT INTO products (product_name,product_id,product_cost,quantity,category,description,created_by,updated_by)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$7) RETURNING *
    `, [product_name, product_id, product_cost, quantity, category||null, description||null, req.user.id]);
    res.status(201).json(rows[0]);
  } catch (err) { next(err); }
};

const updateProduct = async (req, res, next) => {
  try {
    const { product_name, product_id, product_cost, quantity, category, description } = req.body;
    const { rows } = await query(`
      UPDATE products SET product_name=$1,product_id=$2,product_cost=$3,
        quantity=$4,category=$5,description=$6,updated_by=$7
      WHERE id=$8 AND is_active=true RETURNING *
    `, [product_name, product_id, product_cost, quantity, category||null, description||null, req.user.id, req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Product not found.' });
    res.json(rows[0]);
  } catch (err) { next(err); }
};

const deleteProduct = async (req, res, next) => {
  try {
    const { rows } = await query(
      `UPDATE products SET is_active=false,updated_by=$1 WHERE id=$2 RETURNING id`,
      [req.user.id, req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Product not found.' });
    res.json({ message: 'Product deleted.' });
  } catch (err) { next(err); }
};

const getStats = async (req, res, next) => {
  try {
    const { rows: [stats] } = await query(`
      SELECT
        COUNT(*)                                               AS total_products,
        COALESCE(SUM(product_cost * quantity), 0)             AS total_value,
        COUNT(*) FILTER (WHERE quantity = 0)                  AS out_of_stock,
        COUNT(*) FILTER (WHERE quantity > 0 AND quantity <= 5) AS low_stock,
        COUNT(DISTINCT category)                               AS categories
      FROM products WHERE is_active = true
    `);
    res.json(stats);
  } catch (err) { next(err); }
};

module.exports = { getProducts, getProduct, createProduct, updateProduct, deleteProduct, getStats };

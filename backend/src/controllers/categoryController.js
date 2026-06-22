const { query } = require('../config/db');

const getCategories = async (req, res, next) => {
  try {
    const { rows } = await query(`
      SELECT c.*, COUNT(p.id) AS product_count
      FROM categories c
      LEFT JOIN products p ON p.category = c.name AND p.is_active = true
      WHERE c.is_active = true GROUP BY c.id ORDER BY c.name
    `);
    res.json(rows);
  } catch (err) { next(err); }
};

const createCategory = async (req, res, next) => {
  try {
    const { name, color, description } = req.body;
    const { rows } = await query(
      `INSERT INTO categories (name,color,description) VALUES ($1,$2,$3) RETURNING *`,
      [name, color||'#239b8b', description||null]
    );
    res.status(201).json(rows[0]);
  } catch (err) { next(err); }
};

const updateCategory = async (req, res, next) => {
  try {
    const { name, color, description } = req.body;
    const { rows } = await query(
      `UPDATE categories SET name=$1,color=$2,description=$3,updated_at=NOW() WHERE id=$4 AND is_active=true RETURNING *`,
      [name, color, description||null, req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Category not found.' });
    res.json(rows[0]);
  } catch (err) { next(err); }
};

const deleteCategory = async (req, res, next) => {
  try {
    const { rows: [cat] } = await query(`SELECT name FROM categories WHERE id=$1`, [req.params.id]);
    if (!cat) return res.status(404).json({ error: 'Category not found.' });
    const { rows: [{ count }] } = await query(
      `SELECT COUNT(*) FROM products WHERE category=$1 AND is_active=true`, [cat.name]
    );
    if (parseInt(count) > 0)
      return res.status(409).json({ error: `Cannot delete — ${count} product(s) use this category.` });
    await query(`UPDATE categories SET is_active=false WHERE id=$1`, [req.params.id]);
    res.json({ message: 'Category deleted.' });
  } catch (err) { next(err); }
};

module.exports = { getCategories, createCategory, updateCategory, deleteCategory };

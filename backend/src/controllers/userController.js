const bcrypt = require('bcryptjs');
const { query } = require('../config/db');

// GET /api/users — list all users (admin only)
const getUsers = async (req, res, next) => {
  try {
    const { rows } = await query(`
      SELECT id, name, email, role, is_active, created_at
      FROM users ORDER BY created_at DESC
    `);
    res.json(rows);
  } catch (err) { next(err); }
};

// POST /api/users — create a new staff/reception/viewer account
const createUser = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name?.trim() || !email?.trim() || !password)
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    if (password.length < 8)
      return res.status(400).json({ error: 'Password must be at least 8 characters.' });
    if (!['admin','staff','viewer','reception'].includes(role))
      return res.status(400).json({ error: 'Invalid role.' });

    const hash = await bcrypt.hash(password, 12);
    const { rows: [user] } = await query(`
      INSERT INTO users (name,email,password,role)
      VALUES ($1,$2,$3,$4)
      RETURNING id,name,email,role,is_active,created_at
    `, [name.trim(), email.toLowerCase().trim(), hash, role]);

    res.status(201).json(user);
  } catch (err) { next(err); }
};

// PUT /api/users/:id — edit name/email/role/active status
const updateUser = async (req, res, next) => {
  try {
    const { name, email, role, is_active } = req.body;

    if (!['admin','staff','viewer','reception'].includes(role))
      return res.status(400).json({ error: 'Invalid role.' });

    // Prevent the last remaining admin from demoting/deactivating themselves into a lockout
    if (req.params.id === req.user.id && (role !== 'admin' || is_active === false)) {
      const { rows: [{ count }] } = await query(
        `SELECT COUNT(*) FROM users WHERE role='admin' AND is_active=true`
      );
      if (parseInt(count) <= 1)
        return res.status(400).json({ error: 'Cannot remove the last active admin account.' });
    }

    const { rows: [user] } = await query(`
      UPDATE users SET name=$1, email=$2, role=$3, is_active=$4
      WHERE id=$5
      RETURNING id,name,email,role,is_active,created_at
    `, [name, email.toLowerCase().trim(), role, is_active, req.params.id]);

    if (!user) return res.status(404).json({ error: 'User not found.' });
    res.json(user);
  } catch (err) { next(err); }
};

// PATCH /api/users/:id/password — admin resets a user's password
const resetPassword = async (req, res, next) => {
  try {
    const { password } = req.body;
    if (!password || password.length < 8)
      return res.status(400).json({ error: 'Password must be at least 8 characters.' });

    const hash = await bcrypt.hash(password, 12);
    const { rows } = await query(
      `UPDATE users SET password=$1 WHERE id=$2 RETURNING id`,
      [hash, req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'User not found.' });
    res.json({ message: 'Password updated.' });
  } catch (err) { next(err); }
};

// DELETE /api/users/:id — deactivate (soft delete, never hard delete)
const deleteUser = async (req, res, next) => {
  try {
    if (req.params.id === req.user.id)
      return res.status(400).json({ error: 'You cannot deactivate your own account.' });

    const { rows: [target] } = await query(`SELECT role FROM users WHERE id=$1`, [req.params.id]);
    if (!target) return res.status(404).json({ error: 'User not found.' });

    if (target.role === 'admin') {
      const { rows: [{ count }] } = await query(
        `SELECT COUNT(*) FROM users WHERE role='admin' AND is_active=true`
      );
      if (parseInt(count) <= 1)
        return res.status(400).json({ error: 'Cannot deactivate the last active admin account.' });
    }

    await query(`UPDATE users SET is_active=false WHERE id=$1`, [req.params.id]);
    res.json({ message: 'User deactivated.' });
  } catch (err) { next(err); }
};

module.exports = { getUsers, createUser, updateUser, resetPassword, deleteUser };

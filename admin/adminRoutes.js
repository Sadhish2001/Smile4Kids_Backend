const express = require('express');
const db = require('../db');
const authMiddleware = require('../authMiddleware');
const router = express.Router();

// Middleware to check admin
function requireAdmin(req, res, next) {
  if (!req.user || !req.user.is_admin) {
    return res.status(403).json({ message: 'Forbidden: Admins only' });
  }
  next();
}

// Get all users who have purchased videos
router.get('/users-with-purchases', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT u.users_id, u.username, u.email_id, u.avatar, up.language, up.level
      FROM users u
      JOIN user_paid_videos up ON u.users_id = up.user_id
      ORDER BY u.users_id
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Database error', error: err.message });
  }
});

module.exports = router;
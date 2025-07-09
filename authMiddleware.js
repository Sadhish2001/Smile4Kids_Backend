const jwt = require('jsonwebtoken');
const db = require('./db'); // Ensure db.js exports a valid MySQL pool/connection

module.exports = async function authenticate(req, res, next) {
  const authHeader = req.headers['authorization'];

  // Check if Authorization header exists and starts with Bearer
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized: Authentication required' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Optional: Check user status (active/deleted) by ID
    const [rows] = await db.query('SELECT * FROM users WHERE users_id = ?', [decoded.users_id]);

    if (!rows.length) {
      return res.status(401).json({ message: 'Unauthorized: User not found' });
    }

    req.user = rows[0]; // Attach user data to request
    next();
  } catch (err) {
    console.error('JWT auth error:', err.message);
    return res.status(401).json({ message: 'Unauthorized: Invalid or expired token' });
  }
};

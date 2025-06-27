const LoginModel = require('./loginModels');
const jwt = require('jsonwebtoken');
const PaidVideoModel = require('../payment/paidVideoModel'); // Add this at the top

class LoginController {
  async login(req, res) {
    const { email_id, password } = req.body;
    if (!email_id || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    try {
      const user = await LoginModel.findByEmail(email_id);
      if (!user || user.password !== password) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }

      // Fetch paid language/level for this user
      const paidVideos = await PaidVideoModel.getPaidVideos(user.users_id);

      const token = jwt.sign(
        {
          users_id: user.users_id,
          username: user.username,
          email_id: user.email_id,
          avatar: user.avatar,
          level: user.level,
          language: user.language
        },
        process.env.JWT_SECRET
      );
      res.json({
        message: 'Login successful',
        token,
        user: {
          users_id: user.users_id,
          username: user.username,
          email_id: user.email_id,
          avatar: user.avatar,
          level: user.level,
          language: user.language,
          paid_categories: paidVideos // [{language, level}, ...]
        }
      });
    } catch (err) {
      res.status(500).json({ message: 'Database error', error: err.message });
    }
  }
}

module.exports = new LoginController();


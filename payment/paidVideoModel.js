const db = require('../db');

const PaidVideoModel = {
  markPaid: async (user_id, language, level) => {
    await db.query(
      'INSERT IGNORE INTO user_paid_videos (user_id, language, level) VALUES (?, ?, ?)',
      [user_id, language, level]
    );
  },
  getPaidVideos: async (user_id) => {
    const [rows] = await db.query(
      'SELECT language, level FROM user_paid_videos WHERE user_id = ?',
      [user_id]
    );
    return rows; // [{language, level}, ...]
  }
};

module.exports = PaidVideoModel;
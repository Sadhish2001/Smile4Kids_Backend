const db = require('../db');

class UserModel {
    static async create({ username, email_id, password, confirm_password, dob = null, ph_no = null, address = null, avatar = null }) {
        const query = 'INSERT INTO users (username, email_id, password, confirm_password, dob, ph_no, address, avatar) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
        const [results] = await db.query(query, [username, email_id, password, confirm_password, dob, ph_no, address, avatar]);
        return { id: results.insertId, username, email_id, dob, ph_no, address, avatar };
    }

    static async updateProfile({ email_id, dob, ph_no, address, avatar }) {
        const query = 'UPDATE users SET dob = ?, ph_no = ?, address = ?, avatar = ? WHERE email_id = ?';
        const [results] = await db.query(query, [dob, ph_no, address, avatar, email_id]);
        return results;
    }

    static async findByEmail(email_id) {
        const query = 'SELECT * FROM users WHERE email_id = ?';
        const [results] = await db.query(query, [email_id]);
        return results[0];
    }
}
module.exports = UserModel;
const db = require('../db'); // or wherever your db connection is

const PaymentModel = {
  save: async (payment) => {
    const {
      stripe_session_id,
      amount,
      currency,
      course_type,
      status
    } = payment;

    const query = `
      INSERT INTO payments (stripe_session_id, amount, currency, course_type, status)
      VALUES (?, ?, ?, ?, ?)
    `;
    const values = [stripe_session_id, amount, currency, course_type, status];

    return db.query(query, values);
  }
};

module.exports = PaymentModel;

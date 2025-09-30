const { pool } = require('./database');

class Subscription {
  static async create(subscriptionData) {
    const {
      userId,
      name,
      description,
      price,
      currency,
      icon,
      color,
      cycle,
      firstBill,
      remindMe,
      duration,
      categoryId,
      renewalType
    } = subscriptionData;

    try {
      // Convert empty string to null for date field
      const validFirstBill = firstBill && firstBill.trim() !== '' ? firstBill : null;

      const result = await pool.query(
        `INSERT INTO subscriptions
        (user_id, name, description, price, currency, icon, color, cycle, first_bill, remind_me, duration, category_id, renewal_type)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING *`,
        [userId, name, description, price, currency, icon, color, cycle, validFirstBill, remindMe, duration, categoryId, renewalType || 'Автоматически']
      );

      return result.rows[0];
    } catch (error) {
      console.error('Error creating subscription:', error);
      throw error;
    }
  }

  static async findByUserId(userId) {
    try {
      const result = await pool.query(
        `SELECT s.*, c.name as category_name, c.icon as category_icon
        FROM subscriptions s
        LEFT JOIN categories c ON s.category_id = c.id
        WHERE s.user_id = $1 AND s.is_active = true
        ORDER BY s.first_bill ASC`,
        [userId]
      );

      return result.rows;
    } catch (error) {
      console.error('Error finding subscriptions:', error);
      throw error;
    }
  }

  static async findById(id, userId) {
    try {
      const result = await pool.query(
        'SELECT * FROM subscriptions WHERE id = $1 AND user_id = $2',
        [id, userId]
      );

      return result.rows[0] || null;
    } catch (error) {
      console.error('Error finding subscription by id:', error);
      throw error;
    }
  }

  static async update(id, userId, updateData) {
    const {
      name,
      description,
      price,
      currency,
      icon,
      color,
      cycle,
      firstBill,
      remindMe,
      duration,
      categoryId,
      renewalType
    } = updateData;

    try {
      // Convert empty string to null for date field
      const validFirstBill = firstBill && firstBill.trim() !== '' ? firstBill : null;

      const result = await pool.query(
        `UPDATE subscriptions
        SET name = $1, description = $2, price = $3, currency = $4, icon = $5,
            color = $6, cycle = $7, first_bill = $8, remind_me = $9, duration = $10,
            category_id = $11, renewal_type = $12, updated_at = CURRENT_TIMESTAMP
        WHERE id = $13 AND user_id = $14
        RETURNING *`,
        [name, description, price, currency, icon, color, cycle, validFirstBill, remindMe, duration, categoryId, renewalType || 'Автоматически', id, userId]
      );

      return result.rows[0] || null;
    } catch (error) {
      console.error('Error updating subscription:', error);
      throw error;
    }
  }

  static async delete(id, userId) {
    try {
      const result = await pool.query(
        'UPDATE subscriptions SET is_active = false WHERE id = $1 AND user_id = $2 RETURNING *',
        [id, userId]
      );

      return result.rows[0] || null;
    } catch (error) {
      console.error('Error deleting subscription:', error);
      throw error;
    }
  }

  static async getDueSubscriptions() {
    try {
      const result = await pool.query(
        `SELECT s.*, u.telegram_id, u.first_name
        FROM subscriptions s
        JOIN users u ON s.user_id = u.id
        WHERE s.is_active = true AND s.remind_me != 'Never'
        ORDER BY s.first_bill ASC`
      );

      return result.rows;
    } catch (error) {
      console.error('Error getting due subscriptions:', error);
      throw error;
    }
  }
}

module.exports = Subscription;
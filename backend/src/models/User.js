const { pool } = require('./database');

class User {
  static async findOrCreate(telegramId, username, firstName) {
    try {
      const result = await pool.query(
        'SELECT * FROM users WHERE telegram_id = $1',
        [telegramId]
      );

      if (result.rows.length > 0) {
        return result.rows[0];
      }

      const insertResult = await pool.query(
        'INSERT INTO users (telegram_id, username, first_name) VALUES ($1, $2, $3) RETURNING *',
        [telegramId, username, firstName]
      );

      return insertResult.rows[0];
    } catch (error) {
      console.error('Error in findOrCreate user:', error);
      throw error;
    }
  }

  static async findByTelegramId(telegramId) {
    try {
      const result = await pool.query(
        'SELECT * FROM users WHERE telegram_id = $1',
        [telegramId]
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error finding user:', error);
      throw error;
    }
  }
}

module.exports = User;
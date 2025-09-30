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

  static async updateSettings(telegramId, settings) {
    try {
      const { defaultCurrency, displayMode, sortMode } = settings;
      const result = await pool.query(
        `UPDATE users
         SET default_currency = COALESCE($1, default_currency),
             display_mode = COALESCE($2, display_mode),
             sort_mode = COALESCE($3, sort_mode)
         WHERE telegram_id = $4
         RETURNING *`,
        [defaultCurrency, displayMode, sortMode, telegramId]
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error updating user settings:', error);
      throw error;
    }
  }

  static async getSettings(telegramId) {
    try {
      const result = await pool.query(
        'SELECT default_currency, display_mode, sort_mode FROM users WHERE telegram_id = $1',
        [telegramId]
      );
      return result.rows[0] || { default_currency: 'RUB', display_mode: 'converted', sort_mode: 'by_date' };
    } catch (error) {
      console.error('Error getting user settings:', error);
      throw error;
    }
  }
}

module.exports = User;
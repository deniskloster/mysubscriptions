const crypto = require('crypto');

/**
 * Validates Telegram WebApp initData
 * @param {string} initData - The initData string from Telegram WebApp
 * @param {string} botToken - Telegram bot token
 * @returns {Object|null} - Parsed user data if valid, null otherwise
 */
function validateTelegramWebAppData(initData, botToken) {
  try {
    // Parse initData
    const urlParams = new URLSearchParams(initData);
    const hash = urlParams.get('hash');

    if (!hash) {
      console.error('No hash in initData');
      return null;
    }

    // Remove hash from params
    urlParams.delete('hash');

    // Sort params and create data-check-string
    const dataCheckString = Array.from(urlParams.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');

    // Create secret key
    const secretKey = crypto
      .createHmac('sha256', 'WebAppData')
      .update(botToken)
      .digest();

    // Calculate hash
    const calculatedHash = crypto
      .createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex');

    // Compare hashes
    if (calculatedHash !== hash) {
      console.error('Hash mismatch');
      return null;
    }

    // Check auth_date (data should not be older than 24 hours)
    const authDate = parseInt(urlParams.get('auth_date'));
    const currentTime = Math.floor(Date.now() / 1000);
    const timeDiff = currentTime - authDate;

    if (timeDiff > 86400) { // 24 hours
      console.error('InitData too old');
      return null;
    }

    // Parse and return user data
    const userJson = urlParams.get('user');
    if (!userJson) {
      console.error('No user data in initData');
      return null;
    }

    const user = JSON.parse(userJson);

    return {
      id: user.id,
      first_name: user.first_name,
      last_name: user.last_name,
      username: user.username,
      language_code: user.language_code,
      auth_date: authDate
    };
  } catch (error) {
    console.error('Error validating Telegram WebApp data:', error);
    return null;
  }
}

/**
 * Middleware to validate Telegram WebApp authentication
 * TEMPORARILY DISABLED - will be re-enabled after testing
 */
async function telegramAuthMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  // Temporarily disabled - skip auth check
  if (!authHeader || !authHeader.startsWith('tma ')) {
    console.log('Warning: No Telegram auth header, skipping validation (TEMPORARY)');
    return next();
  }

  const initData = authHeader.substring(4); // Remove 'tma ' prefix
  const botToken = process.env.TELEGRAM_BOT_TOKEN;

  const user = validateTelegramWebAppData(initData, botToken);

  if (!user) {
    console.log('Warning: Invalid Telegram auth data, skipping validation (TEMPORARY)');
    return next();
  }

  // Update last_active timestamp
  try {
    const { pool } = require('../models/database');
    await pool.query(
      'UPDATE users SET last_active = CURRENT_TIMESTAMP WHERE telegram_id = $1',
      [user.id]
    );
  } catch (error) {
    console.error('Error updating last_active:', error);
  }

  // Attach user to request
  req.telegramUser = user;
  next();
}

module.exports = {
  validateTelegramWebAppData,
  telegramAuthMiddleware
};

const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { pool } = require('../models/database');
const { telegramAuthMiddleware } = require('../utils/telegramAuth');

// Get or create user
router.post('/init', async (req, res) => {
  try {
    const { telegramId, username, firstName } = req.body;

    const user = await User.findOrCreate(telegramId, username, firstName);
    res.json(user);
  } catch (error) {
    console.error('Error initializing user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get categories
router.get('/categories', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM categories ORDER BY name');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user settings
router.get('/settings/:telegramId', telegramAuthMiddleware, async (req, res) => {
  try {
    const { telegramId } = req.params;

    // Check if authenticated user matches requested user (TEMPORARILY DISABLED)
    if (req.telegramUser && req.telegramUser.id !== parseInt(telegramId)) {
      return res.status(403).json({ error: 'Forbidden: Cannot access other user settings' });
    }

    const settings = await User.getSettings(telegramId);
    res.json(settings);
  } catch (error) {
    console.error('Error fetching user settings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user settings
router.put('/settings/:telegramId', telegramAuthMiddleware, async (req, res) => {
  try {
    const { telegramId } = req.params;

    // Check if authenticated user matches requested user (TEMPORARILY DISABLED)
    if (req.telegramUser && req.telegramUser.id !== parseInt(telegramId)) {
      return res.status(403).json({ error: 'Forbidden: Cannot update other user settings' });
    }

    const settings = req.body;
    const updatedUser = await User.updateSettings(telegramId, settings);
    res.json(updatedUser);
  } catch (error) {
    console.error('Error updating user settings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
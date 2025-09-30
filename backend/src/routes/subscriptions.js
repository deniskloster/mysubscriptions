const express = require('express');
const router = express.Router();
const Subscription = require('../models/Subscription');
const User = require('../models/User');
const { convertCurrency } = require('../services/currencyService');
const { telegramAuthMiddleware } = require('../utils/telegramAuth');

// Get all subscriptions for a user
router.get('/:telegramId', telegramAuthMiddleware, async (req, res) => {
  try {
    const { telegramId } = req.params;

    // Check if authenticated user matches requested user (TEMPORARILY DISABLED)
    if (req.telegramUser && req.telegramUser.id !== parseInt(telegramId)) {
      return res.status(403).json({ error: 'Forbidden: Cannot access other user data' });
    }

    const user = await User.findByTelegramId(telegramId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const subscriptions = await Subscription.findByUserId(user.id);
    res.json(subscriptions);
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new subscription
router.post('/', telegramAuthMiddleware, async (req, res) => {
  try {
    const { telegramId, ...subscriptionData } = req.body;

    // Check if authenticated user matches requested user (TEMPORARILY DISABLED)
    if (req.telegramUser && req.telegramUser.id !== parseInt(telegramId)) {
      return res.status(403).json({ error: 'Forbidden: Cannot create subscription for other user' });
    }

    let user = await User.findByTelegramId(telegramId);
    if (!user) {
      user = await User.findOrCreate(telegramId, '', '');
    }

    const subscription = await Subscription.create({
      userId: user.id,
      ...subscriptionData
    });

    res.status(201).json(subscription);
  } catch (error) {
    console.error('Error creating subscription:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update subscription
router.put('/:id', telegramAuthMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { telegramId, ...updateData } = req.body;

    // Check if authenticated user matches requested user (TEMPORARILY DISABLED)
    if (req.telegramUser && req.telegramUser.id !== parseInt(telegramId)) {
      return res.status(403).json({ error: 'Forbidden: Cannot update subscription for other user' });
    }

    const user = await User.findByTelegramId(telegramId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const subscription = await Subscription.update(id, user.id, updateData);

    if (!subscription) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    res.json(subscription);
  } catch (error) {
    console.error('Error updating subscription:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete subscription
router.delete('/:id', telegramAuthMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { telegramId } = req.body;

    // Check if authenticated user matches requested user (TEMPORARILY DISABLED)
    if (req.telegramUser && req.telegramUser.id !== parseInt(telegramId)) {
      return res.status(403).json({ error: 'Forbidden: Cannot delete subscription for other user' });
    }

    const user = await User.findByTelegramId(telegramId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const subscription = await Subscription.delete(id, user.id);

    if (!subscription) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    res.json({ message: 'Subscription deleted successfully' });
  } catch (error) {
    console.error('Error deleting subscription:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Convert totals to target currency
router.post('/convert-totals', async (req, res) => {
  try {
    const { totals, targetCurrency } = req.body;

    if (!totals || !targetCurrency) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    let convertedTotal = 0;

    for (const [currency, amount] of Object.entries(totals)) {
      const converted = await convertCurrency(parseFloat(amount), currency, targetCurrency);
      convertedTotal += converted;
    }

    res.json({
      total: parseFloat(convertedTotal.toFixed(2)),
      currency: targetCurrency
    });
  } catch (error) {
    console.error('Error converting totals:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get deleted subscriptions count for this month
router.get('/deleted-this-month/:telegramId', telegramAuthMiddleware, async (req, res) => {
  try {
    const { telegramId } = req.params;

    // Check if authenticated user matches requested user (TEMPORARILY DISABLED)
    if (req.telegramUser && req.telegramUser.id !== parseInt(telegramId)) {
      return res.status(403).json({ error: 'Forbidden: Cannot access other user data' });
    }

    const user = await User.findByTelegramId(telegramId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const count = await Subscription.getDeletedThisMonth(user.id);
    res.json({ count });
  } catch (error) {
    console.error('Error getting deleted count:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
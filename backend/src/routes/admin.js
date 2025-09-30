const express = require('express');
const router = express.Router();
const { pool } = require('../models/database');
const { ipWhitelistMiddleware, adminAuthMiddleware } = require('../middleware/adminAuth');

// Apply middleware to all admin routes
router.use(ipWhitelistMiddleware);
router.use(adminAuthMiddleware);

// Dashboard statistics
router.get('/stats', async (req, res) => {
  try {
    // Total users
    const totalUsersResult = await pool.query('SELECT COUNT(*) FROM users');
    const totalUsers = parseInt(totalUsersResult.rows[0].count);

    // New users today
    const todayResult = await pool.query(
      `SELECT COUNT(*) FROM users WHERE created_at >= CURRENT_DATE`
    );
    const newToday = parseInt(todayResult.rows[0].count);

    // New users this week
    const weekResult = await pool.query(
      `SELECT COUNT(*) FROM users WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'`
    );
    const newThisWeek = parseInt(weekResult.rows[0].count);

    // New users this month
    const monthResult = await pool.query(
      `SELECT COUNT(*) FROM users WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE)`
    );
    const newThisMonth = parseInt(monthResult.rows[0].count);

    // Currency usage
    const currencyResult = await pool.query(
      `SELECT default_currency, COUNT(*) as count
       FROM users
       GROUP BY default_currency
       ORDER BY count DESC`
    );

    // Total active subscriptions
    const subsResult = await pool.query(
      'SELECT COUNT(*) FROM subscriptions WHERE is_active = true'
    );
    const totalSubscriptions = parseInt(subsResult.rows[0].count);

    // Popular subscriptions (top 10)
    const popularResult = await pool.query(
      `SELECT name, COUNT(*) as count
       FROM subscriptions
       WHERE is_active = true
       GROUP BY name
       ORDER BY count DESC
       LIMIT 10`
    );

    // Deleted subscriptions this month
    const deletedResult = await pool.query(
      `SELECT COUNT(*) FROM subscriptions
       WHERE is_active = false
       AND deleted_at >= DATE_TRUNC('month', CURRENT_DATE)`
    );
    const deletedThisMonth = parseInt(deletedResult.rows[0].count);

    // Registration chart (last 30 days)
    const chartResult = await pool.query(
      `SELECT DATE(created_at) as date, COUNT(*) as count
       FROM users
       WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
       GROUP BY DATE(created_at)
       ORDER BY date`
    );

    res.json({
      totalUsers,
      newToday,
      newThisWeek,
      newThisMonth,
      currencyUsage: currencyResult.rows,
      totalSubscriptions,
      popularSubscriptions: popularResult.rows,
      deletedThisMonth,
      registrationChart: chartResult.rows
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all users with details
router.get('/users', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
        u.id,
        u.telegram_id,
        u.username,
        u.first_name,
        u.default_currency,
        u.created_at,
        u.last_active,
        COUNT(s.id) FILTER (WHERE s.is_active = true) as active_subscriptions
       FROM users u
       LEFT JOIN subscriptions s ON u.id = s.user_id
       GROUP BY u.id
       ORDER BY u.created_at DESC`
    );

    // Calculate total monthly spending for each user
    const usersWithSpending = await Promise.all(
      result.rows.map(async (user) => {
        const subsResult = await pool.query(
          `SELECT price, currency, cycle
           FROM subscriptions
           WHERE user_id = $1 AND is_active = true`,
          [user.id]
        );

        const totalsByCurrency = {};
        subsResult.rows.forEach(sub => {
          const currency = sub.currency || 'RUB';
          let monthlyAmount = parseFloat(sub.price);

          if (sub.cycle.includes('Year')) {
            monthlyAmount = monthlyAmount / 12;
          } else if (sub.cycle.includes('Week')) {
            monthlyAmount = monthlyAmount * 4;
          } else if (sub.cycle.includes('3 Month')) {
            monthlyAmount = monthlyAmount / 3;
          } else if (sub.cycle.includes('6 Month')) {
            monthlyAmount = monthlyAmount / 6;
          }

          totalsByCurrency[currency] = (totalsByCurrency[currency] || 0) + monthlyAmount;
        });

        // Round totals
        Object.keys(totalsByCurrency).forEach(currency => {
          totalsByCurrency[currency] = parseFloat(totalsByCurrency[currency].toFixed(2));
        });

        return {
          ...user,
          monthly_spending: totalsByCurrency
        };
      })
    );

    res.json(usersWithSpending);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user details
router.get('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Get user info
    const userResult = await pool.query(
      'SELECT * FROM users WHERE id = $1',
      [id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult.rows[0];

    // Get subscriptions
    const subsResult = await pool.query(
      `SELECT * FROM subscriptions
       WHERE user_id = $1
       ORDER BY is_active DESC, created_at DESC`,
      [id]
    );

    res.json({
      user,
      subscriptions: subsResult.rows
    });
  } catch (error) {
    console.error('Error fetching user details:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete user
router.delete('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Cascade delete will handle subscriptions
    await pool.query('DELETE FROM users WHERE id = $1', [id]);

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get most expensive subscriptions (top 10)
router.get('/expensive-subscriptions', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
        s.name,
        s.price,
        s.currency,
        s.cycle,
        u.username,
        u.telegram_id
       FROM subscriptions s
       JOIN users u ON s.user_id = u.id
       WHERE s.is_active = true
       ORDER BY s.price DESC
       LIMIT 10`
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching expensive subscriptions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

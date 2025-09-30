require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const TelegramBot = require('node-telegram-bot-api');
const cron = require('node-cron');

const subscriptionsRouter = require('./routes/subscriptions');
const usersRouter = require('./routes/users');
const adminRouter = require('./routes/admin');
const { initDatabase } = require('./models/database');
const { checkReminders } = require('./services/reminderService');
const User = require('./models/User');
const Subscription = require('./models/Subscription');

const app = express();
const PORT = process.env.PORT || 3002;

// Telegram Bot
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// Routes
app.use('/api/subscriptions', subscriptionsRouter);
app.use('/api/users', usersRouter);
app.use('/api/admin', adminRouter);

// Helper function to get currency symbol
function getCurrencySymbol(currency) {
  const symbols = { 'RUB': '₽', 'USD': '💵', 'EUR': '💶' };
  return symbols[currency] || currency;
}

// Helper function to calculate next bill date
function calculateDaysUntil(firstBill, cycle) {
  if (!firstBill) return 999999;

  const billDate = new Date(firstBill);
  const today = new Date();

  while (billDate < today) {
    if (cycle.includes('Month')) {
      const months = parseInt(cycle.match(/\d+/)[0]);
      billDate.setMonth(billDate.getMonth() + months);
    } else if (cycle.includes('Week')) {
      const weeks = parseInt(cycle.match(/\d+/)[0]);
      billDate.setDate(billDate.getDate() + (weeks * 7));
    } else if (cycle.includes('Year')) {
      const years = parseInt(cycle.match(/\d+/)[0]);
      billDate.setFullYear(billDate.getFullYear() + years);
    }
  }

  const diffTime = billDate - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

// Telegram Bot Commands
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const username = msg.from.username || msg.from.first_name;

  const webAppUrl = process.env.TELEGRAM_WEBAPP_URL;

  const welcomeText = `👋 Добро пожаловать в *Мои Подписки*!

📊 *Что умеет бот:*
• Отслеживание всех ваших подписок
• Напоминания о предстоящих оплатах
• Подсчёт расходов в разных валютах
• Статистика и аналитика трат
• Сортировка по дате и алфавиту

💡 *Основные возможности:*
✓ Добавляйте подписки одним кликом
✓ Выбирайте валюту (₽, 💵, 💶)
✓ Настраивайте напоминания
✓ Просматривайте историю платежей
✓ Следите за ближайшими списаниями

🚀 Откройте приложение и начните управлять своими подписками!`;

  bot.sendMessage(chatId, welcomeText, {
    parse_mode: 'Markdown',
    reply_markup: {
      keyboard: [
        [{ text: '📱 Открыть приложение', web_app: { url: webAppUrl } }],
        [{ text: '📅 Ближайшие оплаты' }]
      ],
      resize_keyboard: true
    }
  });
});

bot.onText(/\/app/, (msg) => {
  const chatId = msg.chat.id;
  const webAppUrl = process.env.TELEGRAM_WEBAPP_URL;

  bot.sendMessage(chatId, 'Нажмите кнопку ниже, чтобы открыть приложение:', {
    reply_markup: {
      inline_keyboard: [
        [{ text: '📱 Открыть Мои Подписки', web_app: { url: webAppUrl } }]
      ]
    }
  });
});

bot.onText(/\/upcoming/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  try {
    const user = await User.findByTelegramId(userId);
    if (!user) {
      bot.sendMessage(chatId, 'Сначала откройте приложение и добавьте подписки!');
      return;
    }

    const subscriptions = await Subscription.findByUserId(user.id);

    // Фильтруем подписки со списанием в ближайшие 7 дней
    const upcoming = subscriptions
      .map(sub => ({
        ...sub,
        daysUntil: calculateDaysUntil(sub.first_bill, sub.cycle)
      }))
      .filter(sub => sub.daysUntil > 0 && sub.daysUntil <= 7)
      .sort((a, b) => a.daysUntil - b.daysUntil);

    if (upcoming.length === 0) {
      bot.sendMessage(chatId, '✅ В ближайшие 7 дней нет запланированных списаний!');
      return;
    }

    // Группируем по валютам
    const totalsByCurrency = {};
    upcoming.forEach(sub => {
      const currency = sub.currency || 'RUB';
      totalsByCurrency[currency] = (totalsByCurrency[currency] || 0) + parseFloat(sub.price);
    });

    let message = '📅 *Ближайшие оплаты (7 дней):*\n\n';

    upcoming.forEach(sub => {
      const icon = sub.icon || '📦';
      const days = sub.daysUntil === 1 ? '1 день' : sub.daysUntil < 5 ? `${sub.daysUntil} дня` : `${sub.daysUntil} дней`;
      message += `${icon} *${sub.name}*\n`;
      message += `   ${getCurrencySymbol(sub.currency)}${sub.price} через ${days}\n\n`;
    });

    message += '💰 *Итого к списанию:*\n';
    Object.entries(totalsByCurrency).forEach(([currency, amount]) => {
      message += `   ${getCurrencySymbol(currency)}${amount.toFixed(2)}\n`;
    });

    bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
  } catch (error) {
    console.error('Error in /upcoming:', error);
    bot.sendMessage(chatId, '❌ Произошла ошибка при загрузке подписок');
  }
});

// Handle button clicks
bot.on('message', async (msg) => {
  if (!msg.text) return;

  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const text = msg.text;

  if (text === '📅 Ближайшие оплаты') {
    // Вызываем команду /upcoming
    bot.emit('text', { ...msg, text: '/upcoming' });
    bot.processUpdate({ message: { ...msg, text: '/upcoming' } });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Admin page (HTML доступен всем, но API защищен IP + auth)
app.get('/admin', (req, res) => {
  res.sendFile(__dirname + '/../public/admin.html');
});

// Schedule reminder check every hour
cron.schedule('0 * * * *', () => {
  console.log('Checking for subscription reminders...');
  checkReminders(bot);
});

// Initialize database and start server
async function start() {
  try {
    await initDatabase();
    console.log('Database initialized');

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Telegram bot is active`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();

module.exports = { bot };
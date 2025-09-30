require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const TelegramBot = require('node-telegram-bot-api');
const cron = require('node-cron');

const subscriptionsRouter = require('./routes/subscriptions');
const usersRouter = require('./routes/users');
const { initDatabase } = require('./models/database');
const { checkReminders } = require('./services/reminderService');

const app = express();
const PORT = process.env.PORT || 3000;

// Telegram Bot
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Routes
app.use('/api/subscriptions', subscriptionsRouter);
app.use('/api/users', usersRouter);

// Telegram Bot Commands
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const username = msg.from.username || msg.from.first_name;

  const webAppUrl = process.env.TELEGRAM_WEBAPP_URL;

  bot.sendMessage(chatId, 'Добро пожаловать в MySubscriptions! 🎯\n\nУправляйте своими подписками и получайте напоминания о продлении.', {
    reply_markup: {
      inline_keyboard: [
        [{ text: '📱 Открыть приложение', web_app: { url: webAppUrl } }]
      ]
    }
  });
});

bot.onText(/\/app/, (msg) => {
  const chatId = msg.chat.id;
  const webAppUrl = process.env.TELEGRAM_WEBAPP_URL;

  bot.sendMessage(chatId, 'Нажмите кнопку ниже, чтобы открыть приложение:', {
    reply_markup: {
      inline_keyboard: [
        [{ text: '📱 Открыть MySubscriptions', web_app: { url: webAppUrl } }]
      ]
    }
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
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
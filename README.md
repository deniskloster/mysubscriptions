# MySubscriptions - Telegram Bot для управления подписками

Telegram бот с Mini App для отслеживания и управления подписками с напоминаниями о продлении.

## Возможности

- 📱 Telegram Mini App с красивым dark mode интерфейсом
- 💰 Управление подписками: добавление, редактирование, удаление
- 🔔 Автоматические напоминания о продлении подписок
- 📊 Подсчет общей стоимости подписок
- 🎨 Пресеты популярных сервисов (Netflix, Spotify, и др.)
- 📅 Настройка циклов оплаты и напоминаний
- 🗂 Категории подписок

## Технологии

**Backend:**
- Node.js + Express
- PostgreSQL
- Telegram Bot API (node-telegram-bot-api)
- node-cron для напоминаний

**Frontend:**
- React + Vite
- Telegram Web App SDK
- Axios

## Установка и запуск

### Требования

- Node.js 18+
- PostgreSQL 15+
- Telegram Bot Token (получить у [@BotFather](https://t.me/botfather))

### Локальная разработка

1. **Клонируйте репозиторий и перейдите в папку проекта**

2. **Настройте backend:**

\`\`\`bash
cd backend
npm install
cp .env.example .env
\`\`\`

Отредактируйте `.env`:
\`\`\`
TELEGRAM_BOT_TOKEN=ваш_токен_бота
TELEGRAM_WEBAPP_URL=https://your-domain.com
PORT=3000
DATABASE_URL=postgresql://postgres:password@localhost:5432/mysubscriptions
NODE_ENV=development
\`\`\`

3. **Настройте frontend:**

\`\`\`bash
cd ../frontend
npm install
cp .env.example .env
\`\`\`

Отредактируйте `.env`:
\`\`\`
VITE_API_URL=http://localhost:3000/api
\`\`\`

4. **Создайте базу данных:**

\`\`\`bash
createdb mysubscriptions
\`\`\`

5. **Запустите backend:**

\`\`\`bash
cd backend
npm run dev
\`\`\`

6. **Запустите frontend:**

\`\`\`bash
cd frontend
npm run dev
\`\`\`

### Docker

\`\`\`bash
# Создайте .env файл в корне проекта
cp backend/.env.example .env

# Запустите все сервисы
docker-compose up -d
\`\`\`

## Создание Telegram бота

1. Откройте [@BotFather](https://t.me/botfather) в Telegram
2. Отправьте `/newbot` и следуйте инструкциям
3. Получите токен бота
4. Настройте Web App URL:
   - Отправьте `/mybots`
   - Выберите вашего бота
   - Bot Settings → Menu Button → URL
   - Введите URL вашего frontend приложения

## API Endpoints

### Subscriptions

- `GET /api/subscriptions/:telegramId` - получить все подписки пользователя
- `POST /api/subscriptions` - создать подписку
- `PUT /api/subscriptions/:id` - обновить подписку
- `DELETE /api/subscriptions/:id` - удалить подписку

### Users

- `POST /api/users/init` - инициализация пользователя
- `GET /api/users/categories` - получить категории

## База данных

### Таблицы:

- `users` - пользователи Telegram
- `subscriptions` - подписки пользователей
- `categories` - категории подписок

## Напоминания

Бот проверяет подписки каждый час и отправляет напоминания согласно настройкам пользователя:
- 1 день до продления
- 3 дня до продления
- 1 неделя до продления
- 2 недели до продления

## Разработка

### Структура проекта

\`\`\`
mysubscriptions/
├── backend/
│   ├── src/
│   │   ├── models/       # Модели БД
│   │   ├── routes/       # API роуты
│   │   ├── services/     # Бизнес-логика
│   │   └── index.js      # Точка входа
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/   # React компоненты
│   │   ├── styles/       # CSS стили
│   │   ├── api/          # API клиент
│   │   ├── utils/        # Утилиты
│   │   └── App.jsx       # Главный компонент
│   └── package.json
└── docker-compose.yml
\`\`\`

## Лицензия

MIT
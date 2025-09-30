const Subscription = require('../models/Subscription');

function calculateNextBillDate(firstBill, cycle) {
  const date = new Date(firstBill);
  const today = new Date();

  // Parse cycle (e.g., "Every 1 Month(s)", "Every 1 Week(s)")
  const cycleMatch = cycle.match(/Every (\d+) (Month|Week|Year)/i);
  if (!cycleMatch) return null;

  const amount = parseInt(cycleMatch[1]);
  const unit = cycleMatch[2].toLowerCase();

  // Calculate next bill date
  while (date < today) {
    if (unit === 'month') {
      date.setMonth(date.getMonth() + amount);
    } else if (unit === 'week') {
      date.setDate(date.getDate() + (amount * 7));
    } else if (unit === 'year') {
      date.setFullYear(date.getFullYear() + amount);
    }
  }

  return date;
}

function shouldSendReminder(nextBillDate, remindMe) {
  if (!nextBillDate || remindMe === 'Never') return false;

  const today = new Date();
  const diffTime = nextBillDate - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  // Parse remind_me (e.g., "1 day before", "1 week before")
  const remindMatch = remindMe.match(/(\d+)\s*(day|week|month)/i);
  if (!remindMatch) return false;

  const amount = parseInt(remindMatch[1]);
  const unit = remindMatch[2].toLowerCase();

  let reminderDays = 0;
  if (unit === 'day') reminderDays = amount;
  else if (unit === 'week') reminderDays = amount * 7;
  else if (unit === 'month') reminderDays = amount * 30;

  return diffDays <= reminderDays && diffDays > 0;
}

async function checkReminders(bot) {
  try {
    const subscriptions = await Subscription.getDueSubscriptions();

    for (const sub of subscriptions) {
      const nextBillDate = calculateNextBillDate(sub.first_bill, sub.cycle);

      if (shouldSendReminder(nextBillDate, sub.remind_me)) {
        const message = `⏰ Напоминание о подписке!\n\n` +
          `📌 ${sub.name}\n` +
          `💰 ${sub.price} ${sub.currency}\n` +
          `📅 Продление: ${nextBillDate.toLocaleDateString('ru-RU')}\n\n` +
          `Не забудьте проверить баланс или отменить подписку, если она больше не нужна.`;

        await bot.sendMessage(sub.telegram_id, message);
        console.log(`Reminder sent to user ${sub.telegram_id} for subscription ${sub.name}`);
      }
    }
  } catch (error) {
    console.error('Error checking reminders:', error);
  }
}

module.exports = { checkReminders, calculateNextBillDate };
export function initTelegramApp() {
  const tg = window.Telegram.WebApp;
  tg.ready();
  return tg;
}

export function getTelegramUser() {
  const tg = window.Telegram?.WebApp;

  if (!tg) {
    console.error('Telegram WebApp not available');
    return null;
  }

  console.log('Telegram WebApp initDataUnsafe:', tg.initDataUnsafe);

  // Check if we have valid Telegram data
  if (!tg.initDataUnsafe?.user?.id) {
    console.error('No Telegram user ID available');
    return null;
  }

  const user = {
    id: tg.initDataUnsafe.user.id,
    firstName: tg.initDataUnsafe.user.first_name || 'User',
    username: tg.initDataUnsafe.user.username || ''
  };

  console.log('Telegram user extracted:', user);
  return user;
}

export function closeTelegramApp() {
  window.Telegram.WebApp.close();
}

export function showBackButton(callback) {
  const tg = window.Telegram.WebApp;
  tg.BackButton.show();
  tg.BackButton.onClick(callback);
}

export function hideBackButton() {
  const tg = window.Telegram.WebApp;
  tg.BackButton.hide();
}

export function setHeaderColor(color) {
  window.Telegram.WebApp.setHeaderColor(color);
}
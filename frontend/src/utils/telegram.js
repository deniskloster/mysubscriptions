export function initTelegramApp() {
  const tg = window.Telegram.WebApp;
  tg.ready();
  return tg;
}

export function getTelegramUser() {
  const tg = window.Telegram.WebApp;
  return {
    id: tg.initDataUnsafe?.user?.id || 123456789, // fallback for testing
    firstName: tg.initDataUnsafe?.user?.first_name || 'Test User',
    username: tg.initDataUnsafe?.user?.username || 'testuser'
  };
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
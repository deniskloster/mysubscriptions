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

  console.log('Telegram WebApp:', {
    initDataUnsafe: tg.initDataUnsafe,
    initData: tg.initData,
    version: tg.version,
    platform: tg.platform
  });

  // Try to get user from initDataUnsafe first
  if (tg.initDataUnsafe?.user?.id) {
    const user = {
      id: tg.initDataUnsafe.user.id,
      firstName: tg.initDataUnsafe.user.first_name || 'User',
      username: tg.initDataUnsafe.user.username || ''
    };
    console.log('Telegram user extracted from initDataUnsafe:', user);
    return user;
  }

  // Fallback: try to parse from initData string
  if (tg.initData) {
    try {
      const params = new URLSearchParams(tg.initData);
      const userJson = params.get('user');

      if (userJson) {
        const userData = JSON.parse(userJson);
        const user = {
          id: userData.id,
          firstName: userData.first_name || 'User',
          username: userData.username || ''
        };
        console.log('Telegram user extracted from initData:', user);
        return user;
      }
    } catch (error) {
      console.error('Error parsing initData:', error);
    }
  }

  console.error('No Telegram user ID available from any source');
  return null;
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
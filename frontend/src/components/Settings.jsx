import { useState, useEffect } from 'react';
import { showBackButton, hideBackButton } from '../utils/telegram';
import { getUserSettings, updateUserSettings } from '../api/users';
import '../styles/Settings.css';

function Settings({ onClose, user }) {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'dark';
  });

  const [defaultCurrency, setDefaultCurrency] = useState('RUB');
  const [displayMode, setDisplayMode] = useState('converted');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    showBackButton(onClose);
    document.documentElement.setAttribute('data-theme', theme);
    loadUserSettings();
    return () => hideBackButton();
  }, []);

  const loadUserSettings = async () => {
    try {
      const settings = await getUserSettings(user.id);
      setDefaultCurrency(settings.default_currency || 'RUB');
      setDisplayMode(settings.display_mode || 'converted');
    } catch (error) {
      console.error('Error loading user settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  const handleCurrencyChange = async (currency) => {
    setDefaultCurrency(currency);
    try {
      await updateUserSettings(user.id, {
        defaultCurrency: currency,
        displayMode
      });
    } catch (error) {
      console.error('Error updating currency:', error);
      alert('Ошибка при сохранении настроек');
    }
  };

  const handleDisplayModeChange = async (mode) => {
    setDisplayMode(mode);
    try {
      await updateUserSettings(user.id, {
        defaultCurrency,
        displayMode: mode
      });
    } catch (error) {
      console.error('Error updating display mode:', error);
      alert('Ошибка при сохранении настроек');
    }
  };

  if (loading) {
    return (
      <div className="settings">
        <div className="settings-header">
          <button className="back-btn" onClick={onClose}>←</button>
          <h2>Настройки</h2>
          <div style={{ width: '40px' }}></div>
        </div>
        <div className="settings-content">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="settings">
      <div className="settings-header">
        <button className="back-btn" onClick={onClose}>←</button>
        <h2>Настройки</h2>
        <div style={{ width: '40px' }}></div>
      </div>

      <div className="settings-content">
        <div className="settings-section">
          <h3>Тема оформления</h3>
          <div className="theme-options">
            <button
              className={`theme-option ${theme === 'dark' ? 'active' : ''}`}
              onClick={() => handleThemeChange('dark')}
            >
              <span className="theme-icon">🌙</span>
              <span className="theme-label">Тёмная</span>
              {theme === 'dark' && <span className="checkmark">✓</span>}
            </button>
            <button
              className={`theme-option ${theme === 'light' ? 'active' : ''}`}
              onClick={() => handleThemeChange('light')}
            >
              <span className="theme-icon">☀️</span>
              <span className="theme-label">Светлая</span>
              {theme === 'light' && <span className="checkmark">✓</span>}
            </button>
          </div>
        </div>

        <div className="settings-section">
          <h3>Валюта по умолчанию</h3>
          <div className="currency-options">
            <button
              className={`currency-option ${defaultCurrency === 'RUB' ? 'active' : ''}`}
              onClick={() => handleCurrencyChange('RUB')}
            >
              <span className="currency-symbol">₽</span>
              <span className="currency-label">Рубли (RUB)</span>
              {defaultCurrency === 'RUB' && <span className="checkmark">✓</span>}
            </button>
            <button
              className={`currency-option ${defaultCurrency === 'USD' ? 'active' : ''}`}
              onClick={() => handleCurrencyChange('USD')}
            >
              <span className="currency-symbol">💵</span>
              <span className="currency-label">Доллары (USD)</span>
              {defaultCurrency === 'USD' && <span className="checkmark">✓</span>}
            </button>
            <button
              className={`currency-option ${defaultCurrency === 'EUR' ? 'active' : ''}`}
              onClick={() => handleCurrencyChange('EUR')}
            >
              <span className="currency-symbol">💶</span>
              <span className="currency-label">Евро (EUR)</span>
              {defaultCurrency === 'EUR' && <span className="checkmark">✓</span>}
            </button>
          </div>
        </div>

        <div className="settings-section">
          <h3>Отображение на главной</h3>
          <div className="display-mode-options">
            <button
              className={`display-mode-option ${displayMode === 'converted' ? 'active' : ''}`}
              onClick={() => handleDisplayModeChange('converted')}
            >
              <span className="display-mode-label">Конвертировать в {defaultCurrency}</span>
              <span className="display-mode-description">
                Все суммы будут показаны в вашей валюте
              </span>
              {displayMode === 'converted' && <span className="checkmark">✓</span>}
            </button>
            <button
              className={`display-mode-option ${displayMode === 'separate' ? 'active' : ''}`}
              onClick={() => handleDisplayModeChange('separate')}
            >
              <span className="display-mode-label">Показать все валюты</span>
              <span className="display-mode-description">
                Отдельные суммы для каждой валюты
              </span>
              {displayMode === 'separate' && <span className="checkmark">✓</span>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Settings;
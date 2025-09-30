import { useState, useEffect } from 'react';
import { showBackButton, hideBackButton } from '../utils/telegram';
import '../styles/Settings.css';

function Settings({ onClose }) {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'dark';
  });

  useEffect(() => {
    showBackButton(onClose);
    document.documentElement.setAttribute('data-theme', theme);
    return () => hideBackButton();
  }, []);

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

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
      </div>
    </div>
  );
}

export default Settings;
import { useState, useEffect } from 'react';
import SubscriptionCard from './SubscriptionCard';
import { getUserSettings } from '../api/users';
import '../styles/SubscriptionsList.css';

function SubscriptionsList({ subscriptions, onAdd, onEdit, onRefresh, user, onSettingsClick }) {
  const [filter, setFilter] = useState('all');
  const [userSettings, setUserSettings] = useState(null);

  useEffect(() => {
    loadUserSettings();
  }, [user]);

  const loadUserSettings = async () => {
    try {
      const settings = await getUserSettings(user.id);
      setUserSettings(settings);
    } catch (error) {
      console.error('Error loading user settings:', error);
      setUserSettings({ default_currency: 'RUB', display_mode: 'converted' });
    }
  };

  const calculateDaysUntil = (firstBill, cycle) => {
    if (!firstBill) return { days: 0, date: new Date() };

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

    return { days: diffDays, date: billDate };
  };

  const getTotalsByCurrency = () => {
    const totals = {};

    subscriptions.forEach(sub => {
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

      totals[currency] = (totals[currency] || 0) + monthlyAmount;
    });

    Object.keys(totals).forEach(currency => {
      totals[currency] = parseFloat(totals[currency].toFixed(2));
    });

    return totals;
  };

  const getCurrencySymbol = (currency) => {
    const symbols = { 'RUB': '₽', 'USD': '💵', 'EUR': '💶' };
    return symbols[currency] || currency;
  };

  const renderTotals = () => {
    if (!userSettings) return null;

    const totals = getTotalsByCurrency();
    const displayMode = userSettings.display_mode || 'converted';

    if (displayMode === 'separate') {
      // Показываем все валюты отдельно
      const currencies = Object.keys(totals);
      if (currencies.length === 0) return <div className="total-amount">0 ₽</div>;

      return (
        <div className="total-amount-multi">
          {currencies.map((currency, index) => (
            <span key={currency} className="currency-total">
              {getCurrencySymbol(currency)}{totals[currency]}
              {index < currencies.length - 1 && <span className="separator"> / </span>}
            </span>
          ))}
        </div>
      );
    } else {
      // Конвертируем все в дефолтную валюту
      // TODO: Реальная конвертация через API будет добавлена позже
      // Пока показываем все валюты раздельно (как в режиме separate)
      const currencies = Object.keys(totals);
      if (currencies.length === 0) return <div className="total-amount">0 ₽</div>;

      // Если все подписки в одной валюте, показываем просто сумму
      if (currencies.length === 1) {
        const currency = currencies[0];
        return (
          <div className="total-amount">
            {getCurrencySymbol(currency)}{totals[currency].toFixed(2)}
          </div>
        );
      }

      // Если несколько валют, показываем все (временно, пока нет конвертации)
      return (
        <div className="total-amount-multi">
          {currencies.map((currency, index) => (
            <span key={currency} className="currency-total">
              {getCurrencySymbol(currency)}{totals[currency]}
              {index < currencies.length - 1 && <span className="separator"> / </span>}
            </span>
          ))}
        </div>
      );
    }
  };

  return (
    <div className="subscriptions-list">
      <header className="list-header">
        <div className="header-top">
          <button className="settings-btn" onClick={onSettingsClick}>⚙️</button>
          <div className="header-title">
            <h1>Все подписки</h1>
          </div>
          <button className="add-btn" onClick={onAdd}>+</button>
        </div>

        <div className="total-section">
          {renderTotals()}
          <div className="total-label">в месяц</div>
        </div>
      </header>

      <div className="subscriptions-container">
        {subscriptions.length === 0 ? (
          <div className="empty-state">
            <p>Нет подписок</p>
            <button className="add-first-btn" onClick={onAdd}>
              Добавить первую подписку
            </button>
          </div>
        ) : (
          subscriptions.map(sub => {
            const timeInfo = calculateDaysUntil(sub.first_bill, sub.cycle);
            return (
              <SubscriptionCard
                key={sub.id}
                subscription={sub}
                daysUntil={timeInfo.days}
                onEdit={() => onEdit(sub)}
              />
            );
          })
        )}
      </div>
    </div>
  );
}

export default SubscriptionsList;
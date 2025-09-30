import { useState, useEffect } from 'react';
import SubscriptionCard from './SubscriptionCard';
import { getUserSettings } from '../api/users';
import { convertTotals } from '../api/subscriptions';
import '../styles/SubscriptionsList.css';

function SubscriptionsList({ subscriptions, onAdd, onEdit, onRefresh, user, onSettingsClick, onStatisticsClick }) {
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
    if (!firstBill) return { days: 999999, date: new Date() };

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

  const sortSubscriptions = (subs) => {
    if (!userSettings) return subs;

    const sortMode = userSettings.sort_mode || 'by_date';

    if (sortMode === 'alphabetical') {
      return [...subs].sort((a, b) => a.name.localeCompare(b.name, 'ru'));
    } else {
      // by_date - сортировка по ближайшему списанию
      return [...subs].sort((a, b) => {
        const daysA = calculateDaysUntil(a.first_bill, a.cycle).days;
        const daysB = calculateDaysUntil(b.first_bill, b.cycle).days;
        return daysA - daysB;
      });
    }
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

  const [convertedTotal, setConvertedTotal] = useState(null);

  useEffect(() => {
    if (userSettings && userSettings.display_mode === 'converted') {
      convertTotalsToDefault();
    }
  }, [subscriptions, userSettings]);

  const convertTotalsToDefault = async () => {
    if (!userSettings) return;

    const totals = getTotalsByCurrency();
    const targetCurrency = userSettings.default_currency || 'RUB';

    try {
      const result = await convertTotals(totals, targetCurrency);
      setConvertedTotal(result);
    } catch (error) {
      console.error('Error converting totals:', error);
      setConvertedTotal(null);
    }
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

      // Если несколько валют, показываем конвертированную сумму
      if (convertedTotal) {
        return (
          <div className="total-amount">
            {getCurrencySymbol(convertedTotal.currency)}{convertedTotal.total}
          </div>
        );
      }

      // Пока грузится конвертация, показываем все валюты
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
          <div className="header-left">
            <button className="icon-btn" onClick={onSettingsClick}>⚙️</button>
            <button className="icon-btn" onClick={onStatisticsClick}>📊</button>
          </div>
          <div className="header-title">
            <h1>У вас {subscriptions.length} {subscriptions.length === 1 ? 'подписка' : subscriptions.length < 5 ? 'подписки' : 'подписок'}</h1>
          </div>
          <button className="add-btn" onClick={onAdd}>
            <span className="add-icon">+</span>
            <span className="add-text">Добавить</span>
          </button>
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
          sortSubscriptions(subscriptions).map(sub => {
            const timeInfo = calculateDaysUntil(sub.first_bill, sub.cycle);
            return (
              <SubscriptionCard
                key={sub.id}
                subscription={sub}
                daysUntil={timeInfo.days === 999999 ? 0 : timeInfo.days}
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
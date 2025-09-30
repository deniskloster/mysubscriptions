import { useState, useEffect } from 'react';
import { showBackButton, hideBackButton } from '../utils/telegram';
import { getDeletedThisMonth, convertTotals } from '../api/subscriptions';
import { getUserSettings } from '../api/users';
import '../styles/Statistics.css';

function Statistics({ onClose, subscriptions, user }) {
  const [deletedCount, setDeletedCount] = useState(0);
  const [mostExpensive, setMostExpensive] = useState(null);
  const [userSettings, setUserSettings] = useState(null);

  useEffect(() => {
    showBackButton(onClose);
    loadData();
    return () => hideBackButton();
  }, []);

  const loadData = async () => {
    try {
      const [deletedResult, settings] = await Promise.all([
        getDeletedThisMonth(user.id),
        getUserSettings(user.id)
      ]);
      setDeletedCount(deletedResult.count);
      setUserSettings(settings);
      await findMostExpensive(settings);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const findMostExpensive = async (settings) => {
    if (subscriptions.length === 0) return;

    const targetCurrency = settings?.default_currency || 'RUB';
    let maxConverted = 0;
    let maxSub = null;

    for (const sub of subscriptions) {
      let monthlyAmount = parseFloat(sub.price);

      // Приводим к месячной стоимости
      if (sub.cycle.includes('Year')) {
        monthlyAmount = monthlyAmount / 12;
      } else if (sub.cycle.includes('Week')) {
        monthlyAmount = monthlyAmount * 4;
      } else if (sub.cycle.includes('3 Month')) {
        monthlyAmount = monthlyAmount / 3;
      } else if (sub.cycle.includes('6 Month')) {
        monthlyAmount = monthlyAmount / 6;
      }

      // Конвертируем в целевую валюту
      try {
        const converted = await convertTotals({ [sub.currency]: monthlyAmount }, targetCurrency);
        if (converted.total > maxConverted) {
          maxConverted = converted.total;
          maxSub = sub;
        }
      } catch (error) {
        console.error('Error converting subscription:', error);
      }
    }

    setMostExpensive(maxSub);
  };

  const getCurrencySymbol = (currency) => {
    const symbols = { 'RUB': '₽', 'USD': '💵', 'EUR': '💶' };
    return symbols[currency] || currency;
  };

  const calculateTotalSpent = () => {
    const totals = {};

    subscriptions.forEach(sub => {
      if (!sub.first_bill) return;

      const currency = sub.currency || 'RUB';
      const price = parseFloat(sub.price);
      const firstBillDate = new Date(sub.first_bill);
      const today = new Date();

      // Вычисляем количество списаний
      let paymentsCount = 0;
      let currentBillDate = new Date(firstBillDate);

      while (currentBillDate <= today) {
        paymentsCount++;

        // Переходим к следующей дате списания
        if (sub.cycle.includes('Month')) {
          const months = parseInt(sub.cycle.match(/\d+/)[0]);
          currentBillDate.setMonth(currentBillDate.getMonth() + months);
        } else if (sub.cycle.includes('Week')) {
          const weeks = parseInt(sub.cycle.match(/\d+/)[0]);
          currentBillDate.setDate(currentBillDate.getDate() + (weeks * 7));
        } else if (sub.cycle.includes('Year')) {
          const years = parseInt(sub.cycle.match(/\d+/)[0]);
          currentBillDate.setFullYear(currentBillDate.getFullYear() + years);
        }
      }

      const totalForSub = price * paymentsCount;
      totals[currency] = (totals[currency] || 0) + totalForSub;
    });

    return totals;
  };

  const getNewSubscriptionsThisMonth = () => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    return subscriptions.filter(sub => {
      const createdDate = new Date(sub.created_at);
      return createdDate >= startOfMonth;
    }).length;
  };

  const totalSpent = calculateTotalSpent();
  const newThisMonth = getNewSubscriptionsThisMonth();

  return (
    <div className="statistics">
      <div className="statistics-header">
        <button className="back-btn" onClick={onClose}>←</button>
        <h2>Статистика</h2>
        <div style={{ width: '40px' }}></div>
      </div>

      <div className="statistics-content">
        <div className="stat-card">
          <div className="stat-icon">💰</div>
          <div className="stat-label">Всего потрачено</div>
          <div className="stat-value-multi">
            {Object.keys(totalSpent).length === 0 ? (
              <span className="stat-value">0 ₽</span>
            ) : (
              Object.entries(totalSpent).map(([currency, amount]) => (
                <div key={currency} className="stat-currency-row">
                  <span className="stat-value">
                    {getCurrencySymbol(currency)}{amount.toFixed(2)}
                  </span>
                </div>
              ))
            )}
          </div>
          <div className="stat-description">С момента добавления подписок</div>
        </div>

        {mostExpensive && (
          <div className="stat-card">
            <div className="stat-icon">👑</div>
            <div className="stat-label">Самая дорогая подписка</div>
            <div className="stat-value-subscription">
              <div className="stat-sub-icon" style={{ backgroundColor: mostExpensive.color }}>
                {mostExpensive.icon || mostExpensive.name.charAt(0).toUpperCase()}
              </div>
              <div className="stat-sub-info">
                <div className="stat-sub-name">{mostExpensive.name}</div>
                <div className="stat-sub-price">
                  {getCurrencySymbol(mostExpensive.currency)}{mostExpensive.price} / {mostExpensive.cycle.includes('Month') ? 'месяц' : mostExpensive.cycle.includes('Year') ? 'год' : 'период'}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="stat-row">
          <div className="stat-card-small">
            <div className="stat-icon-small">📈</div>
            <div className="stat-value-small">{newThisMonth}</div>
            <div className="stat-label-small">Новых в этом месяце</div>
          </div>

          <div className="stat-card-small">
            <div className="stat-icon-small">📉</div>
            <div className="stat-value-small">{deletedCount}</div>
            <div className="stat-label-small">Удалено в этом месяце</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Statistics;

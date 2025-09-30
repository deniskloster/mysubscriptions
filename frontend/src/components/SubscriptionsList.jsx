import { useState } from 'react';
import SubscriptionCard from './SubscriptionCard';
import '../styles/SubscriptionsList.css';

function SubscriptionsList({ subscriptions, onAdd, onEdit, onRefresh, user }) {
  const [filter, setFilter] = useState('all');

  const calculateDaysUntil = (firstBill, cycle) => {
    const billDate = new Date(firstBill);
    const today = new Date();

    // Simple calculation - can be improved
    while (billDate < today) {
      if (cycle.includes('Month')) {
        const months = parseInt(cycle.match(/\d+/)[0]);
        billDate.setMonth(billDate.getMonth() + months);
      } else if (cycle.includes('Week')) {
        const weeks = parseInt(cycle.match(/\d+/)[0]);
        billDate.setDate(billDate.getDate() + (weeks * 7));
      }
    }

    const diffTime = billDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return { days: diffDays, date: billDate };
  };

  const getTotalMonthly = () => {
    return subscriptions.reduce((total, sub) => {
      // Convert all to monthly estimate
      let monthlyAmount = parseFloat(sub.price);

      if (sub.cycle.includes('Year')) {
        monthlyAmount = monthlyAmount / 12;
      } else if (sub.cycle.includes('Week')) {
        monthlyAmount = monthlyAmount * 4;
      }

      return total + monthlyAmount;
    }, 0).toFixed(2);
  };

  return (
    <div className="subscriptions-list">
      <header className="list-header">
        <div className="header-top">
          <button className="settings-btn">⚙️</button>
          <div className="header-title">
            <span className="dropdown-icon">▼</span>
            <h1>All Subscriptions</h1>
          </div>
          <button className="add-btn" onClick={onAdd}>+</button>
        </div>

        <div className="total-section">
          <div className="total-amount">${getTotalMonthly()}</div>
          <div className="total-label">per month</div>
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
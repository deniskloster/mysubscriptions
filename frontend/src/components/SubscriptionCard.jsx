import '../styles/SubscriptionCard.css';

function SubscriptionCard({ subscription, daysUntil, onEdit }) {
  const getTimeDisplay = () => {
    if (daysUntil <= 7) {
      return `${daysUntil} ${daysUntil === 1 ? 'ДЕНЬ' : daysUntil < 5 ? 'ДНЯ' : 'ДНЕЙ'}`;
    } else if (daysUntil <= 30) {
      const weeks = Math.floor(daysUntil / 7);
      return `${weeks} ${weeks === 1 ? 'НЕДЕЛЯ' : weeks < 5 ? 'НЕДЕЛИ' : 'НЕДЕЛЬ'}`;
    }
    return null;
  };

  const getCurrencySymbol = (currency) => {
    const symbols = { 'RUB': '₽', 'USD': '$', 'EUR': '€' };
    return symbols[currency] || currency;
  };

  const timeDisplay = getTimeDisplay();

  return (
    <div
      className="subscription-card"
      style={{ backgroundColor: subscription.color || '#4A90E2' }}
      onClick={onEdit}
    >
      <div className="card-content">
        <div className="card-left">
          <div className="card-icon">
            {subscription.icon || subscription.name.charAt(0).toUpperCase()}
          </div>
          <span className="card-name">{subscription.name}</span>
        </div>
        <div className="card-right">
          <span className="card-price">
            {getCurrencySymbol(subscription.currency)}{subscription.price}
          </span>
          {timeDisplay && (
            <span className="card-time">{timeDisplay}</span>
          )}
        </div>
      </div>
    </div>
  );
}

export default SubscriptionCard;
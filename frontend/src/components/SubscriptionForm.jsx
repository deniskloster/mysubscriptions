import { useState, useEffect } from 'react';
import { showBackButton, hideBackButton } from '../utils/telegram';
import { createSubscription, updateSubscription, deleteSubscription, getCategories } from '../api/subscriptions';
import '../styles/SubscriptionForm.css';

const PRESET_SERVICES = [
  { name: 'Netflix', icon: 'N', color: '#E50914', price: 7.99 },
  { name: 'Spotify', icon: '♫', color: '#1DB954', price: 9.99 },
  { name: 'YouTube Premium', icon: '▶', color: '#FF0000', price: 11.99 },
  { name: 'Apple Music', icon: '🎵', color: '#FA243C', price: 9.99 },
  { name: 'Amazon Prime', icon: 'a', color: '#FF9900', price: 14.99 },
  { name: 'Disney+', icon: 'D+', color: '#113CCF', price: 7.99 },
  { name: 'HBO Max', icon: 'HBO', color: '#7D3FDC', price: 15.99 },
  { name: 'iCloud', icon: '☁', color: '#3B82F6', price: 0.99 }
];

function SubscriptionForm({ subscription, onSave, onClose, user }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    currency: 'USD',
    icon: '',
    color: '#4A90E2',
    cycle: 'Every 1 Month(s)',
    firstBill: '',
    remindMe: 'Never',
    duration: 'Forever',
    categoryId: null
  });

  const [categories, setCategories] = useState([]);
  const [showPresets, setShowPresets] = useState(false);

  useEffect(() => {
    showBackButton(onClose);
    loadCategories();

    if (subscription) {
      setFormData({
        name: subscription.name,
        description: subscription.description || '',
        price: subscription.price,
        currency: subscription.currency,
        icon: subscription.icon || '',
        color: subscription.color,
        cycle: subscription.cycle,
        firstBill: subscription.first_bill?.split('T')[0] || '',
        remindMe: subscription.remind_me,
        duration: subscription.duration,
        categoryId: subscription.category_id
      });
    } else {
      setShowPresets(true);
    }

    return () => hideBackButton();
  }, [subscription]);

  const loadCategories = async () => {
    try {
      const cats = await getCategories();
      setCategories(cats);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const handlePresetSelect = (preset) => {
    setFormData({
      ...formData,
      name: preset.name,
      icon: preset.icon,
      color: preset.color,
      price: preset.price
    });
    setShowPresets(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const data = {
        telegramId: user.id,
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        currency: formData.currency,
        icon: formData.icon,
        color: formData.color,
        cycle: formData.cycle,
        firstBill: formData.firstBill,
        remindMe: formData.remindMe,
        duration: formData.duration,
        categoryId: formData.categoryId
      };

      if (subscription) {
        await updateSubscription(subscription.id, data);
      } else {
        await createSubscription(data);
      }

      onSave();
    } catch (error) {
      console.error('Error saving subscription:', error);
      alert('Ошибка при сохранении подписки');
    }
  };

  const handleDelete = async () => {
    if (!confirm('Удалить эту подписку?')) return;

    try {
      await deleteSubscription(subscription.id, user.id);
      onSave();
    } catch (error) {
      console.error('Error deleting subscription:', error);
      alert('Ошибка при удалении подписки');
    }
  };

  if (showPresets) {
    return (
      <div className="subscription-form">
        <div className="form-header" style={{ backgroundColor: formData.color }}>
          <button className="back-btn" onClick={onClose}>←</button>
          <h2>Выберите сервис</h2>
          <button className="custom-btn" onClick={() => setShowPresets(false)}>
            Свой
          </button>
        </div>
        <div className="presets-grid">
          {PRESET_SERVICES.map(preset => (
            <div
              key={preset.name}
              className="preset-card"
              style={{ backgroundColor: preset.color }}
              onClick={() => handlePresetSelect(preset)}
            >
              <div className="preset-icon">{preset.icon}</div>
              <div className="preset-name">{preset.name}</div>
              <div className="preset-price">${preset.price}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="subscription-form">
      <div className="form-header" style={{ backgroundColor: formData.color }}>
        <button className="back-btn" onClick={onClose}>←</button>
        <h2>{formData.name || 'New Subscription'}</h2>
        <button className="save-btn" onClick={handleSubmit}>Save</button>
      </div>

      <div className="form-preview" style={{ backgroundColor: formData.color }}>
        <div className="preview-icon">{formData.icon || '?'}</div>
        <div className="preview-price">${formData.price || '0.00'}</div>
      </div>

      <form onSubmit={handleSubmit} className="form-fields">
        <div className="form-field">
          <label>Name</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Spotify"
            required
          />
        </div>

        <div className="form-field">
          <label>Description</label>
          <input
            type="text"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Enter description"
          />
        </div>

        <div className="form-field">
          <label>Price</label>
          <input
            type="number"
            step="0.01"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
            placeholder="9.99"
            required
          />
        </div>

        <div className="form-field">
          <label>Categories</label>
          <select
            value={formData.categoryId || ''}
            onChange={(e) => setFormData({ ...formData, categoryId: parseInt(e.target.value) })}
          >
            <option value="">Select category</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>
                {cat.icon} {cat.name}
              </option>
            ))}
          </select>
        </div>

        <div className="form-field">
          <label>First bill</label>
          <input
            type="date"
            value={formData.firstBill}
            onChange={(e) => setFormData({ ...formData, firstBill: e.target.value })}
            required
          />
        </div>

        <div className="form-field">
          <label>Cycle</label>
          <select
            value={formData.cycle}
            onChange={(e) => setFormData({ ...formData, cycle: e.target.value })}
          >
            <option value="Every 1 Week(s)">Every 1 Week</option>
            <option value="Every 1 Month(s)">Every 1 Month</option>
            <option value="Every 3 Month(s)">Every 3 Months</option>
            <option value="Every 6 Month(s)">Every 6 Months</option>
            <option value="Every 1 Year(s)">Every 1 Year</option>
          </select>
        </div>

        <div className="form-field">
          <label>Duration</label>
          <select
            value={formData.duration}
            onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
          >
            <option value="Forever">Forever</option>
            <option value="1 Year">1 Year</option>
            <option value="6 Months">6 Months</option>
            <option value="3 Months">3 Months</option>
          </select>
        </div>

        <div className="form-field">
          <label>Remind me</label>
          <select
            value={formData.remindMe}
            onChange={(e) => setFormData({ ...formData, remindMe: e.target.value })}
          >
            <option value="Never">Never</option>
            <option value="1 day before">1 day before</option>
            <option value="3 days before">3 days before</option>
            <option value="1 week before">1 week before</option>
            <option value="2 weeks before">2 weeks before</option>
          </select>
        </div>

        <div className="form-field">
          <label>Currency</label>
          <select
            value={formData.currency}
            onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
          >
            <option value="USD">USD ($)</option>
            <option value="EUR">EUR (€)</option>
            <option value="RUB">RUB (₽)</option>
          </select>
        </div>

        {subscription && (
          <button type="button" className="delete-btn" onClick={handleDelete}>
            DELETE SUBSCRIPTION
          </button>
        )}
      </form>
    </div>
  );
}

export default SubscriptionForm;
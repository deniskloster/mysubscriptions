import { useState, useEffect } from 'react';
import { showBackButton, hideBackButton } from '../utils/telegram';
import { createSubscription, updateSubscription, deleteSubscription } from '../api/subscriptions';
import '../styles/SubscriptionForm.css';

const PRESET_SERVICES = [
  { name: 'Netflix', icon: '🎬', color: '#E50914', price: 699 },
  { name: 'Spotify', icon: '🎵', color: '#1DB954', price: 299 },
  { name: 'YouTube Premium', icon: '▶️', color: '#FF0000', price: 399 },
  { name: 'Apple Music', icon: '🎵', color: '#FA243C', price: 299 },
  { name: 'Amazon Prime', icon: '📦', color: '#FF9900', price: 599 },
  { name: 'Disney+', icon: '✨', color: '#113CCF', price: 399 },
  { name: 'HBO Max', icon: '🎭', color: '#7D3FDC', price: 499 },
  { name: 'iCloud', icon: '☁️', color: '#3B82F6', price: 59 }
];

const POPULAR_EMOJIS = [
  '🎬', '🎵', '📱', '☁️', '💪', '📦', '🎮', '📺',
  '🎧', '📖', '🍔', '🚗', '🏠', '💳', '🎓', '⚡',
  '🔥', '❤️', '⭐', '🎯', '🚀', '💻', '📷', '🎨'
];

const PRESET_COLORS = [
  '#E50914', '#1DB954', '#FF0000', '#FA243C', '#FF9900',
  '#113CCF', '#7D3FDC', '#3B82F6', '#10B981', '#F59E0B',
  '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#6366F1'
];

function SubscriptionForm({ subscription, onSave, onClose, user }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    currency: 'RUB',
    icon: '',
    color: '#4A90E2',
    cycle: 'Every 1 Month(s)',
    firstBill: '',
    remindMe: 'Never',
    duration: 'Forever'
  });

  const [showPresets, setShowPresets] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);

  useEffect(() => {
    showBackButton(onClose);

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
        duration: subscription.duration
      });
    } else {
      setShowPresets(true);
    }

    return () => hideBackButton();
  }, [subscription]);

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
        categoryId: null
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

  const getCurrencySymbol = (currency) => {
    const symbols = { 'RUB': '₽', 'USD': '$', 'EUR': '€' };
    return symbols[currency] || currency;
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
              <div className="preset-price">{preset.price} ₽</div>
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
        <h2>{formData.name || 'Новая подписка'}</h2>
        <button className="save-btn" onClick={handleSubmit}>Сохранить</button>
      </div>

      <div className="form-preview" style={{ backgroundColor: formData.color }}>
        <div className="preview-icon">{formData.icon || '?'}</div>
        <div className="preview-price">
          {getCurrencySymbol(formData.currency)}{formData.price || '0.00'}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="form-fields">
        <div className="form-field">
          <label>Название</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Spotify"
            required
          />
        </div>

        <div className="form-field">
          <label>Описание</label>
          <input
            type="text"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Введите описание"
          />
        </div>

        <div className="form-field">
          <label>Иконка (эмодзи)</label>
          <div className="icon-input-group">
            <input
              type="text"
              value={formData.icon}
              onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
              placeholder="🎵"
              maxLength="2"
            />
            <button
              type="button"
              className="emoji-picker-btn"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            >
              😊
            </button>
          </div>
          {showEmojiPicker && (
            <div className="emoji-picker">
              {POPULAR_EMOJIS.map(emoji => (
                <button
                  key={emoji}
                  type="button"
                  className="emoji-option"
                  onClick={() => {
                    setFormData({ ...formData, icon: emoji });
                    setShowEmojiPicker(false);
                  }}
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="form-field">
          <label>Цвет фона</label>
          <div className="color-input-group">
            <div
              className="color-preview"
              style={{ backgroundColor: formData.color }}
              onClick={() => setShowColorPicker(!showColorPicker)}
            />
            <input
              type="text"
              value={formData.color}
              onChange={(e) => setFormData({ ...formData, color: e.target.value })}
              placeholder="#4A90E2"
            />
          </div>
          {showColorPicker && (
            <div className="color-picker">
              {PRESET_COLORS.map(color => (
                <button
                  key={color}
                  type="button"
                  className="color-option"
                  style={{ backgroundColor: color }}
                  onClick={() => {
                    setFormData({ ...formData, color });
                    setShowColorPicker(false);
                  }}
                />
              ))}
            </div>
          )}
        </div>

        <div className="form-field">
          <label>Цена</label>
          <input
            type="number"
            step="0.01"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
            placeholder="299"
            required
          />
        </div>

        <div className="form-field">
          <label>Валюта</label>
          <select
            value={formData.currency}
            onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
          >
            <option value="RUB">RUB (₽)</option>
            <option value="USD">USD ($)</option>
            <option value="EUR">EUR (€)</option>
          </select>
        </div>

        <div className="form-field">
          <label>Первый платёж</label>
          <input
            type="date"
            value={formData.firstBill}
            onChange={(e) => setFormData({ ...formData, firstBill: e.target.value })}
          />
        </div>

        <div className="form-field">
          <label>Периодичность</label>
          <select
            value={formData.cycle}
            onChange={(e) => setFormData({ ...formData, cycle: e.target.value })}
          >
            <option value="Every 1 Week(s)">Каждую неделю</option>
            <option value="Every 1 Month(s)">Каждый месяц</option>
            <option value="Every 3 Month(s)">Каждые 3 месяца</option>
            <option value="Every 6 Month(s)">Каждые 6 месяцев</option>
            <option value="Every 1 Year(s)">Каждый год</option>
          </select>
        </div>

        <div className="form-field">
          <label>Длительность</label>
          <select
            value={formData.duration}
            onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
          >
            <option value="Forever">Навсегда</option>
            <option value="1 Year">1 год</option>
            <option value="6 Months">6 месяцев</option>
            <option value="3 Months">3 месяца</option>
          </select>
        </div>

        <div className="form-field">
          <label>Напомнить</label>
          <select
            value={formData.remindMe}
            onChange={(e) => setFormData({ ...formData, remindMe: e.target.value })}
          >
            <option value="Never">Никогда</option>
            <option value="1 day before">За 1 день</option>
            <option value="3 days before">За 3 дня</option>
            <option value="1 week before">За неделю</option>
            <option value="2 weeks before">За 2 недели</option>
          </select>
        </div>

        {subscription && (
          <button type="button" className="delete-btn" onClick={handleDelete}>
            УДАЛИТЬ ПОДПИСКУ
          </button>
        )}
      </form>
    </div>
  );
}

export default SubscriptionForm;
import { useState, useEffect } from 'react';
import SubscriptionsList from './components/SubscriptionsList';
import SubscriptionForm from './components/SubscriptionForm';
import { initTelegramApp, getTelegramUser } from './utils/telegram';
import { getSubscriptions } from './api/subscriptions';
import './styles/App.css';

function App() {
  const [subscriptions, setSubscriptions] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingSubscription, setEditingSubscription] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const tg = initTelegramApp();
    const telegramUser = getTelegramUser();
    setUser(telegramUser);

    // Expand app to full height
    tg.expand();

    // Load subscriptions
    loadSubscriptions(telegramUser.id);
  }, []);

  const loadSubscriptions = async (telegramId) => {
    try {
      setLoading(true);
      const data = await getSubscriptions(telegramId);
      setSubscriptions(data);
    } catch (error) {
      console.error('Error loading subscriptions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddClick = () => {
    setEditingSubscription(null);
    setShowForm(true);
  };

  const handleEditClick = (subscription) => {
    setEditingSubscription(subscription);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingSubscription(null);
  };

  const handleFormSave = () => {
    loadSubscriptions(user.id);
    handleFormClose();
  };

  if (loading) {
    return (
      <div className="app loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="app">
      {!showForm ? (
        <SubscriptionsList
          subscriptions={subscriptions}
          onAdd={handleAddClick}
          onEdit={handleEditClick}
          onRefresh={() => loadSubscriptions(user.id)}
          user={user}
        />
      ) : (
        <SubscriptionForm
          subscription={editingSubscription}
          onSave={handleFormSave}
          onClose={handleFormClose}
          user={user}
        />
      )}
    </div>
  );
}

export default App;
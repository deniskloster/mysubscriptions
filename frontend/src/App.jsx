import { useState, useEffect } from 'react';
import SubscriptionsList from './components/SubscriptionsList';
import SubscriptionForm from './components/SubscriptionForm';
import Settings from './components/Settings';
import Statistics from './components/Statistics';
import { initTelegramApp, getTelegramUser } from './utils/telegram';
import { getSubscriptions } from './api/subscriptions';
import './styles/App.css';

function App() {
  const [subscriptions, setSubscriptions] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showStatistics, setShowStatistics] = useState(false);
  const [editingSubscription, setEditingSubscription] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const tg = initTelegramApp();

    // Expand app to full height immediately
    tg.expand();

    // Load theme from localStorage
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);

    // Wait a bit for Telegram WebApp to initialize
    const initTimer = setTimeout(() => {
      const telegramUser = getTelegramUser();

      // Check if Telegram user data is available
      if (!telegramUser) {
        setLoading(false);
        console.error('No Telegram user data available');
        return;
      }

      console.log('Telegram user loaded:', telegramUser);
      setUser(telegramUser);

      // Load subscriptions
      loadSubscriptions(telegramUser.id);
    }, 100);

    return () => clearTimeout(initTimer);
  }, []);

  const loadSubscriptions = async (telegramId) => {
    console.log('loadSubscriptions called with telegramId:', telegramId);
    try {
      setLoading(true);
      const data = await getSubscriptions(telegramId);
      console.log('Loaded subscriptions:', data);
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

  const handleSettingsClick = () => {
    setShowSettings(true);
  };

  const handleSettingsClose = () => {
    setShowSettings(false);
  };

  const handleStatisticsClick = () => {
    setShowStatistics(true);
  };

  const handleStatisticsClose = () => {
    setShowStatistics(false);
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
      {showSettings ? (
        <Settings onClose={handleSettingsClose} user={user} />
      ) : showStatistics ? (
        <Statistics onClose={handleStatisticsClose} subscriptions={subscriptions} user={user} />
      ) : !showForm ? (
        <SubscriptionsList
          subscriptions={subscriptions}
          onAdd={handleAddClick}
          onEdit={handleEditClick}
          onRefresh={() => loadSubscriptions(user.id)}
          onSettingsClick={handleSettingsClick}
          onStatisticsClick={handleStatisticsClick}
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
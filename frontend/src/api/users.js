import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002/api';

// Get Telegram initData for authentication
function getInitData() {
  if (window.Telegram?.WebApp?.initData) {
    return window.Telegram.WebApp.initData;
  }
  return '';
}

// Configure axios to include auth header
axios.interceptors.request.use((config) => {
  const initData = getInitData();
  if (initData && config.url?.includes('/api/')) {
    config.headers.Authorization = `tma ${initData}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export async function getUserSettings(telegramId) {
  const response = await axios.get(`${API_URL}/users/settings/${telegramId}`);
  return response.data;
}

export async function updateUserSettings(telegramId, settings) {
  const response = await axios.put(`${API_URL}/users/settings/${telegramId}`, settings);
  return response.data;
}
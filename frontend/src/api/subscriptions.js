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

export async function getSubscriptions(telegramId) {
  const response = await axios.get(`${API_URL}/subscriptions/${telegramId}`);
  return response.data;
}

export async function createSubscription(data) {
  const response = await axios.post(`${API_URL}/subscriptions`, data);
  return response.data;
}

export async function updateSubscription(id, data) {
  const response = await axios.put(`${API_URL}/subscriptions/${id}`, data);
  return response.data;
}

export async function deleteSubscription(id, telegramId) {
  const response = await axios.delete(`${API_URL}/subscriptions/${id}`, {
    data: { telegramId }
  });
  return response.data;
}

export async function getCategories() {
  const response = await axios.get(`${API_URL}/users/categories`);
  return response.data;
}

export async function convertTotals(totals, targetCurrency) {
  const response = await axios.post(`${API_URL}/subscriptions/convert-totals`, {
    totals,
    targetCurrency
  });
  return response.data;
}

export async function getDeletedThisMonth(telegramId) {
  const response = await axios.get(`${API_URL}/subscriptions/deleted-this-month/${telegramId}`);
  return response.data;
}
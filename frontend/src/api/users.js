import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002/api';

export async function getUserSettings(telegramId) {
  const response = await axios.get(`${API_URL}/users/settings/${telegramId}`);
  return response.data;
}

export async function updateUserSettings(telegramId, settings) {
  const response = await axios.put(`${API_URL}/users/settings/${telegramId}`, settings);
  return response.data;
}
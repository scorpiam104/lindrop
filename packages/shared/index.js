import axios from 'axios';

const runtimeEnv = typeof process !== 'undefined' ? process.env || {} : {};
const apiBaseUrl = runtimeEnv.EXPO_PUBLIC_API_URL
  || runtimeEnv.VITE_API_URL
  || runtimeEnv.API_URL
  || 'http://localhost:5000/api';

export const apiClient = axios.create({
  baseURL: apiBaseUrl,
  headers: {
    'Content-Type': 'application/json'
  }
});

export function formatGHS(amount) {
  return `GH₵ ${Number(amount || 0).toFixed(2)}`;
};

export function validateGhanaPhone(phone) {
  const normalized = String(phone || '').replace(/[\s-]/g, '');
  const localNumber = normalized.replace(/^\+233/, '0');

  if (!/^0\d{9}$/.test(localNumber)) {
    return false;
  }

  return /^(020|024|025|026|027|050|053|054|055|056|057|059)/.test(localNumber);
}

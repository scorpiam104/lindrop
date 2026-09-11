import { apiClient } from '@my-app/shared';

export function getToken() { return localStorage.getItem('luma_token'); }
export function getMerchant() { try { return JSON.parse(localStorage.getItem('luma_merchant') || 'null'); } catch { return null; } }
export function saveSession(data) { localStorage.setItem('luma_token', data.token); localStorage.setItem('luma_merchant', JSON.stringify(data.merchant)); window.dispatchEvent(new Event('linkpay:merchant-updated')); }
export function clearSession() { localStorage.removeItem('luma_token'); localStorage.removeItem('luma_merchant'); }
export function authConfig() { return { headers: { Authorization: `Bearer ${getToken()}` } }; }
export function apiCall(method, url, data) { return apiClient({ method, url, data, ...authConfig() }); }

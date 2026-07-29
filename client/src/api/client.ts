import axios from 'axios';
import { getCachedResponse, setCachedResponse, invalidateCachedResponse } from './cache';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = (() => { try { return localStorage.getItem('token') } catch { return null } })();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => {
    // Cache GET responses for offline resilience
    if (response.config.method?.toLowerCase() === 'get' && response.status === 200) {
      setCachedResponse(response.config.url!, response.data);
    }
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      try { localStorage.removeItem('token') } catch {}
    }
    // On network error, try serving cached GET response
    if (isOfflineError(error) && error.config?.method?.toLowerCase() === 'get') {
      const cached = getCachedResponse(error.config.url!);
      if (cached) {
        return Promise.resolve({ data: cached.data, status: 200, statusText: 'OK (cached)', headers: {}, config: error.config });
      }
    }
    return Promise.reject(error);
  }
);

// Invalidate cache on POST/PUT/PATCH/DELETE for same URL prefix
api.interceptors.response.use(
  (response) => {
    if (response.config.method && !['get', 'head'].includes(response.config.method.toLowerCase())) {
      const url = response.config.url || '';
      invalidateCachedResponse(url.split('?')[0].replace(/\/\d+$/, ''));
    }
    return response;
  },
  (error) => Promise.reject(error)
);

export function isOfflineError(error: any): boolean {
  return !error.response && (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error'));
}

export default api;

import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { storage } from './storage';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:5000/api/v1';

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach access token to every request
api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const token = await storage.getAccessToken();
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (__DEV__) {
    console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`);
  }
  return config;
});

// Log responses in dev
api.interceptors.response.use(
  (response) => {
    if (__DEV__) {
      console.log(`[API] ${response.status} ${response.config.url}`);
    }
    return response;
  },
  (error: AxiosError) => {
    if (__DEV__) {
      console.warn(`[API] ${error.response?.status ?? 'ERR'} ${error.config?.url}`, error.response?.data);
    }
    return Promise.reject(error);
  },
);

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null = null) {
  failedQueue.forEach((p) => {
    if (error) p.reject(error);
    else p.resolve(token!);
  });
  failedQueue = [];
}

// Auto-refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then((token) => {
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return api(originalRequest);
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const refreshToken = await storage.getRefreshToken();
      if (!refreshToken) throw new Error('No refresh token');

      const { data } = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken });
      const { accessToken, refreshToken: newRefreshToken } = data.data;

      await storage.setAccessToken(accessToken);
      await storage.setRefreshToken(newRefreshToken);

      processQueue(null, accessToken);
      originalRequest.headers.Authorization = `Bearer ${accessToken}`;
      return api(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      await storage.clearAuth();
      // App store handles redirect to login via auth state change
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);

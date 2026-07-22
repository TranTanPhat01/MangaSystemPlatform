import axios from 'axios';
import { useAuthStore } from '@/store/auth-store';

const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5200';

export const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

const isAuthSessionEndpoint = (url?: string) => {
  const path = url?.split('?')[0];
  return path === '/identity/auth/login' || path === '/identity/auth/register' || path === '/identity/auth/logout' || path === '/identity/auth/refresh';
};

let refreshInFlight: Promise<string> | null = null;

const refreshAccessToken = async (): Promise<string> => {
  if (refreshInFlight) return refreshInFlight;
  refreshInFlight = (async () => {
    const { refreshToken, setAuth } = useAuthStore.getState();
    if (!refreshToken) throw new Error('No refresh token.');
    const response = await axios.post(`${baseURL}/identity/auth/refresh`, { refreshToken });
    const payload = response.data?.data;
    if (!response.data?.success || !payload?.accessToken) throw new Error('Refresh failed.');
    setAuth(payload);
    return payload.accessToken as string;
  })().finally(() => { refreshInFlight = null; });
  return refreshInFlight;
};

api.interceptors.request.use(
  (config) => {
    // Read directly from the Zustand store
    const token = useAuthStore.getState().accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  async (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const request = error.config as (typeof error.config & { _retry?: boolean });
    if (error.response?.status === 401 && request && !request._retry && !isAuthSessionEndpoint(request.url)) {
      request._retry = true;
      try {
        const accessToken = await refreshAccessToken();
        request.headers.Authorization = `Bearer ${accessToken}`;
        return api(request);
      } catch {
        useAuthStore.getState().clearAuthSession();
        if (typeof window !== 'undefined') window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

import axios, {AxiosError, InternalAxiosRequestConfig} from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── API URL ────────────────────────────────────────────────────────────────
// Points to the same Railway backend as the web app.
// To change: update this constant or set REACT_APP_API_URL in your env.
export const API_BASE_URL =
  process.env.REACT_APP_API_URL ||
  'https://protechtbim-production.up.railway.app/api/v1';

// ─── Axios instance ──────────────────────────────────────────────────────────
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30_000,
  headers: {'Content-Type': 'application/json'},
});

// Attach JWT on every request
apiClient.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  try {
    const raw = await AsyncStorage.getItem('auth_tokens');
    if (raw) {
      const {accessToken} = JSON.parse(raw);
      if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`;
      }
    }
  } catch {}
  return config;
});

// Handle 401 → force logout by clearing storage
apiClient.interceptors.response.use(
  res => res,
  async (err: AxiosError) => {
    if (err.response?.status === 401) {
      await AsyncStorage.multiRemove(['auth_tokens', 'auth_user']);
      // Navigation to Login is handled by AuthContext listener
    }
    return Promise.reject(err);
  },
);

// ─── Generic request helper ──────────────────────────────────────────────────
export async function apiRequest<T>(
  endpoint: string,
  options: {method?: string; data?: unknown; params?: Record<string, unknown>} = {},
): Promise<T> {
  const response = await apiClient.request<T>({
    url: endpoint,
    method: options.method ?? 'GET',
    data: options.data,
    params: options.params,
  });
  return response.data;
}

const API_BASE_URL = import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD ? '/api/v1' : 'http://localhost:3000/api/v1');

// Only log in development
const isDev = import.meta.env.DEV;
if (isDev) {
  console.log('[API] Base URL:', API_BASE_URL);
}

export const getAuthToken = (): string | null => {
  try {
    const t = localStorage.getItem('auth_tokens');
    return t ? JSON.parse(t).accessToken : null;
  } catch { return null; }
};

export const apiRequest = async (
  endpoint: string,
  options: RequestInit = {},
  timeoutMs = 30000
): Promise<Response> => {
  const token = getAuthToken();
  const url = `${API_BASE_URL}${endpoint}`;

  const headers: Record<string, string> = {
    ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  // Abort after timeoutMs (default 30s)
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, { ...options, headers, signal: controller.signal });
    clearTimeout(timer);

    if (response.status === 401) {
      localStorage.removeItem('auth_tokens');
      localStorage.removeItem('auth_user');
      window.location.href = '/login';
    }
    return response;
  } catch (error: any) {
    clearTimeout(timer);
    if (error.name === 'AbortError') {
      throw new Error(`Request timeout after ${timeoutMs / 1000}s: ${url}`);
    }
    if (isDev) console.error('[API] Request failed:', url, error.message);
    throw error;
  }
};

export default apiRequest;

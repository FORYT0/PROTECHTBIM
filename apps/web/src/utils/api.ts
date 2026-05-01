// API utility — Local machine via Cloudflare Tunnel
// Tunnel URL: https://pete-studied-valuable-boat.trycloudflare.com
// NOTE: Cloudflare quick-tunnel URL changes on each restart.
// For a permanent URL: cloudflared tunnel login → create named tunnel.

const TUNNEL_URL = 'https://pete-studied-valuable-boat.trycloudflare.com/api/v1';

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD ? TUNNEL_URL : 'http://localhost:3000/api/v1');

export const getAuthToken = (): string | null => {
  try {
    const t = localStorage.getItem('auth_tokens');
    return t ? JSON.parse(t).accessToken : null;
  } catch { return null; }
};

// Warm the API on app load — prevents cold feeling on first click
let _apiIsWarm = false;
export function warmApi(): void {
  if (_apiIsWarm) return;
  fetch(API_BASE_URL.replace('/api/v1', '/health'), { signal: AbortSignal.timeout(15_000) })
    .then(r => { if (r.ok) _apiIsWarm = true; })
    .catch(() => {});
}

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
      throw new Error('Request timed out. Check your internet connection.');
    }
    throw error;
  }
};

export default apiRequest;

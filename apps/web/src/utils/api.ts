// API utility — works with Railway, Render, Fly.io, or any backend.
// Handles Render free-tier cold-start (up to 60s wake time) gracefully.

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD ? '' : 'http://localhost:3000/api/v1');

const isDev = import.meta.env.DEV;

export const getAuthToken = (): string | null => {
  try {
    const t = localStorage.getItem('auth_tokens');
    return t ? JSON.parse(t).accessToken : null;
  } catch { return null; }
};

// ── Cold-start detection ────────────────────────────────────────────────
// Render free tier spins down after 15 min. First request takes ~30-60s.
// We detect this with a long timeout and show the user a toast if slow.
let _coldStartWarningShown = false;
let _apiIsWarm = false;

function showColdStartBanner() {
  if (_coldStartWarningShown) return;
  _coldStartWarningShown = true;
  // Dispatch a custom event — App.tsx listens and shows a toast
  window.dispatchEvent(new CustomEvent('api:cold-start', {
    detail: { message: 'API is waking up — first request may take ~30 seconds on the free tier.' }
  }));
}

// Warm the API silently on app load (fire and forget)
export function warmApi(): void {
  if (_apiIsWarm) return;
  fetch(`${API_BASE_URL}/health`, { signal: AbortSignal.timeout(90_000) })
    .then(() => { _apiIsWarm = true; })
    .catch(() => {});
}

// ── Main request function ───────────────────────────────────────────────
export const apiRequest = async (
  endpoint: string,
  options: RequestInit = {},
  timeoutMs = 60000   // 60s — generous for Render cold-start
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

  // Show cold-start warning after 5s with no response
  const coldStartTimer = setTimeout(showColdStartBanner, 5000);

  try {
    const response = await fetch(url, { ...options, headers, signal: controller.signal });
    clearTimeout(timer);
    clearTimeout(coldStartTimer);
    _apiIsWarm = true;
    _coldStartWarningShown = false; // reset for next cold-start

    if (response.status === 401) {
      localStorage.removeItem('auth_tokens');
      localStorage.removeItem('auth_user');
      window.location.href = '/login';
    }
    return response;
  } catch (error: any) {
    clearTimeout(timer);
    clearTimeout(coldStartTimer);
    if (error.name === 'AbortError') {
      throw new Error(`Request timed out after ${timeoutMs / 1000}s. The server may be waking up — please try again.`);
    }
    if (isDev) console.error('[API] Request failed:', url, error.message);
    throw error;
  }
};

export default apiRequest;

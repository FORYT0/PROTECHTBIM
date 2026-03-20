const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1';

console.log('🔧 API Configuration:', {
  VITE_API_URL: import.meta.env.VITE_API_URL,
  API_BASE_URL,
  mode: import.meta.env.MODE,
});

export const getAuthToken = (): string | null => {
  const tokens = localStorage.getItem('auth_tokens');
  if (!tokens) return null;

  try {
    const parsed = JSON.parse(tokens);
    return parsed.accessToken;
  } catch {
    return null;
  }
};

export const apiRequest = async (
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> => {
  const token = getAuthToken();
  const fullUrl = `${API_BASE_URL}${endpoint}`;

  const headers: Record<string, string> = {
    ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  console.log('🌐 API Request:', {
    url: fullUrl,
    method: options.method || 'GET',
    hasToken: !!token,
    headers,
  });

  try {
    console.log('⏳ Sending request...');
    
    const response = await fetch(fullUrl, {
      ...options,
      headers,
    });

    console.log('✅ API Response:', {
      url: fullUrl,
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
    });

    // Handle token expiration
    if (response.status === 401) {
      // Clear auth data and redirect to login
      localStorage.removeItem('auth_tokens');
      localStorage.removeItem('auth_user');
      window.location.href = '/login';
    }

    return response;
  } catch (error) {
    console.error('❌ API Request Failed:', {
      url: fullUrl,
      error: error instanceof Error ? error.message : error,
      errorType: error instanceof TypeError ? 'Network Error' : 'Unknown Error',
    });
    throw error;
  }
};

export default apiRequest;

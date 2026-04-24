import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import notificationService from '../services/NotificationService';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

interface AuthContextType {
  user: User | null;
  tokens: AuthTokens | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'auth_tokens';
const USER_KEY  = 'auth_user';

// ─── Single source of truth for API base URL ─────────────────────
// Reads VITE_API_URL baked in at build time by Vite.
// Falls back to relative /api/v1 (works when API & frontend are co-hosted).
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser]       = useState<User | null>(null);
  const [tokens, setTokens]   = useState<AuthTokens | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Rehydrate from localStorage on mount
  useEffect(() => {
    const storedTokens = localStorage.getItem(TOKEN_KEY);
    const storedUser   = localStorage.getItem(USER_KEY);
    if (storedTokens && storedUser) {
      try {
        const parsedTokens = JSON.parse(storedTokens);
        setTokens(parsedTokens);
        setUser(JSON.parse(storedUser));
        notificationService.connect(parsedTokens.accessToken);
      } catch {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const url = `${API_BASE_URL}/auth/login`;
    console.log('[Auth] POST', url);

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || `Login failed (${response.status})`);
    }

    const data = await response.json();
    const authTokens: AuthTokens = {
      accessToken:  data.tokens.accessToken,
      refreshToken: data.tokens.refreshToken,
    };

    setTokens(authTokens);
    setUser(data.user);
    localStorage.setItem(TOKEN_KEY, JSON.stringify(authTokens));
    localStorage.setItem(USER_KEY,  JSON.stringify(data.user));
    notificationService.connect(authTokens.accessToken);
  };

  const register = async (name: string, email: string, password: string) => {
    const url = `${API_BASE_URL}/auth/register`;
    console.log('[Auth] POST', url);

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || `Registration failed (${response.status})`);
    }

    const data = await response.json();
    const authTokens: AuthTokens = {
      accessToken:  data.tokens.accessToken,
      refreshToken: data.tokens.refreshToken,
    };

    setTokens(authTokens);
    setUser(data.user);
    localStorage.setItem(TOKEN_KEY, JSON.stringify(authTokens));
    localStorage.setItem(USER_KEY,  JSON.stringify(data.user));
    notificationService.connect(authTokens.accessToken);
  };

  const logout = () => {
    const currentToken = tokens?.accessToken;
    setUser(null);
    setTokens(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    notificationService.disconnect();

    if (currentToken) {
      fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${currentToken}` },
      }).catch(() => {});
    }
  };

  return (
    <AuthContext.Provider value={{
      user, tokens, login, register, logout,
      isAuthenticated: !!user && !!tokens,
      isLoading,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {authService} from '../api/services';

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
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'auth_tokens';
const USER_KEY  = 'auth_user';

export const AuthProvider: React.FC<{children: ReactNode}> = ({children}) => {
  const [user, setUser]     = useState<User | null>(null);
  const [tokens, setTokens] = useState<AuthTokens | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Rehydrate session on app start
  useEffect(() => {
    (async () => {
      try {
        const [rawTokens, rawUser] = await AsyncStorage.multiGet([TOKEN_KEY, USER_KEY]);
        const storedTokens = rawTokens[1] ? JSON.parse(rawTokens[1]) : null;
        const storedUser   = rawUser[1]   ? JSON.parse(rawUser[1])   : null;
        if (storedTokens && storedUser) {
          setTokens(storedTokens);
          setUser(storedUser);
        }
      } catch {
        await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const persist = async (authTokens: AuthTokens, authUser: User) => {
    await AsyncStorage.multiSet([
      [TOKEN_KEY, JSON.stringify(authTokens)],
      [USER_KEY,  JSON.stringify(authUser)],
    ]);
    setTokens(authTokens);
    setUser(authUser);
  };

  const login = async (email: string, password: string) => {
    const data = await authService.login(email, password);
    const authTokens: AuthTokens = {
      accessToken:  data.tokens.accessToken,
      refreshToken: data.tokens.refreshToken,
    };
    await persist(authTokens, data.user as User);
  };

  const register = async (name: string, email: string, password: string) => {
    const data = await authService.register(name, email, password);
    const authTokens: AuthTokens = {
      accessToken:  data.tokens.accessToken,
      refreshToken: data.tokens.refreshToken,
    };
    await persist(authTokens, data.user as User);
  };

  const logout = async () => {
    await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
    setTokens(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        tokens,
        login,
        register,
        logout,
        isAuthenticated: !!tokens && !!user,
        isLoading,
      }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) {throw new Error('useAuth must be used within AuthProvider');}
  return ctx;
};

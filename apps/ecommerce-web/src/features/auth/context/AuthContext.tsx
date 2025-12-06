import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { logger } from '../../../shared/utils/logger';

interface User {
  username: string;
  scopes: string[];
}

interface AuthContextValue {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  login: (username: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const FAKE_AUTH_URL = '/fake-auth';

interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
}

function parseJwt(token: string): { sub: string; scope: string } | null {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => {
    return sessionStorage.getItem('authToken');
  });
  const [user, setUser] = useState<User | null>(() => {
    const savedToken = sessionStorage.getItem('authToken');
    if (savedToken) {
      const payload = parseJwt(savedToken);
      if (payload) {
        return {
          username: payload.sub,
          scopes: payload.scope.split(' '),
        };
      }
    }
    return null;
  });
  const [isLoading, setIsLoading] = useState(false);

  const login = useCallback(async (username: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${FAKE_AUTH_URL}/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error_description || 'Login failed');
      }

      const data: TokenResponse = await response.json();
      const accessToken = data.access_token;

      // Parse token to get user info
      const payload = parseJwt(accessToken);
      if (!payload) {
        throw new Error('Invalid token received');
      }

      // Store token
      sessionStorage.setItem('authToken', accessToken);
      setToken(accessToken);
      setUser({
        username: payload.sub,
        scopes: payload.scope.split(' '),
      });

      logger.info('User logged in', { username: payload.sub });
    } catch (error) {
      logger.error('Login failed', error instanceof Error ? error : new Error(String(error)));
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem('authToken');
    setToken(null);
    setUser(null);
    logger.info('User logged out');
  }, []);

  const value: AuthContextValue = {
    isAuthenticated: !!token,
    user,
    token,
    login,
    logout,
    isLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { getAuthConfig, AuthConfig } from '../config';

interface User {
  id: string;
  username: string;
  permissions: string[];
  storeNumber?: number;
}

interface AuthContextValue {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  authConfig: AuthConfig;
  login: (username: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function parseTokenClaims(token: string): User | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return {
      id: payload.sub || '',
      username: payload.username || '',
      permissions: payload.permissions || [],
      storeNumber: payload.store_number,
    };
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authConfig] = useState(() => getAuthConfig());
  const [token, setToken] = useState<string | null>(
    () => sessionStorage.getItem('authToken')
  );
  const [user, setUser] = useState<User | null>(() => {
    const stored = sessionStorage.getItem('authToken');
    return stored ? parseTokenClaims(stored) : null;
  });
  const [isLoading, setIsLoading] = useState(false);

  const login = useCallback(async (username: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${authConfig.authUrl}/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, userType: 'EMPLOYEE', storeNumber: 1234 }),
      });

      if (!response.ok) throw new Error('Login failed');

      const data = await response.json();
      const accessToken = data.access_token;
      const claims = parseTokenClaims(accessToken);

      sessionStorage.setItem('authToken', accessToken);
      setToken(accessToken);
      setUser(claims);
    } finally {
      setIsLoading(false);
    }
  }, [authConfig]);

  const logout = useCallback(() => {
    sessionStorage.removeItem('authToken');
    setToken(null);
    setUser(null);
  }, []);

  const hasPermission = useCallback((permission: string) => {
    if (!user) return false;
    return user.permissions.includes(permission) || user.permissions.includes('admin');
  }, [user]);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: !!token,
        user,
        token,
        authConfig,
        login,
        logout,
        isLoading,
        hasPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}

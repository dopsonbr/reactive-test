import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { getAuthConfig, AuthConfig } from '../config';
import { useLogin } from '../api';

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

export const AuthContext = createContext<AuthContextValue | null>(null);

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

  const loginMutation = useLogin(authConfig.authUrl);

  const login = useCallback(async (username: string) => {
    const data = await loginMutation.mutateAsync({ username });
    const accessToken = data.access_token;
    const claims = parseTokenClaims(accessToken);

    sessionStorage.setItem('authToken', accessToken);
    setToken(accessToken);
    setUser(claims);
  }, [loginMutation]);

  const logout = useCallback(() => {
    sessionStorage.removeItem('authToken');
    setToken(null);
    setUser(null);
  }, []);

  const hasPermission = useCallback((permission: string) => {
    if (!user) return false;
    const normalizedPermission = permission.toUpperCase();
    return user.permissions.some(p => p.toUpperCase() === normalizedPermission)
      || user.permissions.some(p => p.toUpperCase() === 'ADMIN');
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
        isLoading: loginMutation.isPending,
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

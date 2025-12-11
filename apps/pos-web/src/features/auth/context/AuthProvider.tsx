import { useState, useCallback, useMemo, type ReactNode } from 'react';
import { AuthContext, type POSUser, type AuthContextValue } from './AuthContext';
import {
  UserRole,
  Permission,
  ROLE_PERMISSIONS,
  ROLE_MARKDOWN_TIER,
  type MarkdownPermissionTier,
} from '../types/roles';

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<POSUser | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const login = useCallback(
    async (username: string, storeNumber: number, role: UserRole = UserRole.ASSOCIATE) => {
      setIsLoading(true);
      try {
        // In a real app, this would call the auth API
        // For now, we simulate authentication
        const mockUser: POSUser = {
          id: `emp-${username}`,
          name: username,
          email: `${username}@example.com`,
          role,
          storeNumber,
          employeeId: `EMP${Math.floor(Math.random() * 10000)
            .toString()
            .padStart(4, '0')}`,
        };

        // Simulate API call delay
        await new Promise((resolve) => setTimeout(resolve, 500));

        setUser(mockUser);
        // Store session in localStorage for persistence
        localStorage.setItem('pos-user', JSON.stringify(mockUser));
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('pos-user');
  }, []);

  const hasPermission = useCallback(
    (permission: Permission): boolean => {
      if (!user) return false;
      return ROLE_PERMISSIONS[user.role].includes(permission);
    },
    [user]
  );

  const role = user?.role ?? null;
  const permissions = useMemo(
    () => (role ? ROLE_PERMISSIONS[role] : []),
    [role]
  );
  const markdownTier: MarkdownPermissionTier | null = role
    ? ROLE_MARKDOWN_TIER[role]
    : null;
  const storeNumber = user?.storeNumber ?? null;

  const value: AuthContextValue = useMemo(
    () => ({
      user,
      isAuthenticated: !!user,
      isLoading,
      role,
      permissions,
      markdownTier,
      storeNumber,
      login,
      logout,
      hasPermission,
    }),
    [user, isLoading, role, permissions, markdownTier, storeNumber, login, logout, hasPermission]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

import { createContext, useContext } from 'react';
import { Permission, UserRole, MarkdownPermissionTier } from '../types/roles';

export interface POSUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  storeNumber: number;
  employeeId: string;
}

export interface AuthContextValue {
  user: POSUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  role: UserRole | null;
  permissions: Permission[];
  markdownTier: MarkdownPermissionTier | null;
  storeNumber: number | null;

  login: (username: string, storeNumber: number, role?: UserRole) => Promise<void>;
  logout: () => void;
  hasPermission: (permission: Permission) => boolean;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

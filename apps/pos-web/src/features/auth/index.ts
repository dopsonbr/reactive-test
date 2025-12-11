// Context
export { AuthContext, useAuth } from './context/AuthContext';
export type { POSUser, AuthContextValue } from './context/AuthContext';
export { AuthProvider } from './context/AuthProvider';

// Types
export {
  UserRole,
  Permission,
  ROLE_PERMISSIONS,
  ROLE_MARKDOWN_TIER,
  hasPermission,
  getMarkdownTier,
} from './types/roles';
export type { MarkdownPermissionTier } from './types/roles';

// Hooks
export {
  usePermission,
  usePermissions,
  useAnyPermission,
  useMarkdownPermission,
  useTransactionPermissions,
  useCustomerPermissions,
  useOrderPermissions,
  useB2BPermissions,
} from './hooks/usePermission';

// Components
export {
  ProtectedRoute,
  RequirePermission,
  RequireRole,
} from './components/ProtectedRoute';

// Pages
export { LoginPage } from './pages/LoginPage';
export { UnauthorizedPage } from './pages/UnauthorizedPage';

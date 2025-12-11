import { type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Permission, UserRole } from '../types/roles';

interface ProtectedRouteProps {
  children: ReactNode;
  /** Required permission(s) - all must be present if array */
  permission?: Permission | Permission[];
  /** Required role(s) - any of these roles grants access */
  roles?: UserRole[];
  /** Custom fallback when unauthorized (instead of redirect) */
  fallback?: ReactNode;
  /** Redirect path when not authenticated */
  loginPath?: string;
  /** Redirect path when authenticated but unauthorized */
  unauthorizedPath?: string;
}

export function ProtectedRoute({
  children,
  permission,
  roles,
  fallback,
  loginPath = '/login',
  unauthorizedPath = '/unauthorized',
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, hasPermission, role } = useAuth();
  const location = useLocation();

  // Show nothing while loading
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to={loginPath} state={{ from: location }} replace />;
  }

  // Check role-based access
  if (roles && roles.length > 0) {
    if (!role || !roles.includes(role)) {
      if (fallback) return <>{fallback}</>;
      return <Navigate to={unauthorizedPath} replace />;
    }
  }

  // Check permission-based access
  if (permission) {
    const permissions = Array.isArray(permission) ? permission : [permission];
    const hasAllPermissions = permissions.every((p) => hasPermission(p));

    if (!hasAllPermissions) {
      if (fallback) return <>{fallback}</>;
      return <Navigate to={unauthorizedPath} replace />;
    }
  }

  return <>{children}</>;
}

/**
 * Component that only renders children if user has permission
 */
interface RequirePermissionProps {
  children: ReactNode;
  permission: Permission | Permission[];
  fallback?: ReactNode;
}

export function RequirePermission({
  children,
  permission,
  fallback = null,
}: RequirePermissionProps) {
  const { hasPermission, isAuthenticated } = useAuth();

  if (!isAuthenticated) return <>{fallback}</>;

  const permissions = Array.isArray(permission) ? permission : [permission];
  const hasAllPermissions = permissions.every((p) => hasPermission(p));

  if (!hasAllPermissions) return <>{fallback}</>;

  return <>{children}</>;
}

/**
 * Component that only renders children if user has one of the specified roles
 */
interface RequireRoleProps {
  children: ReactNode;
  roles: UserRole[];
  fallback?: ReactNode;
}

export function RequireRole({ children, roles, fallback = null }: RequireRoleProps) {
  const { role, isAuthenticated } = useAuth();

  if (!isAuthenticated || !role) return <>{fallback}</>;

  if (!roles.includes(role)) return <>{fallback}</>;

  return <>{children}</>;
}

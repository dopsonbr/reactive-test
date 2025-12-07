/**
 * Auth configuration for dual-mode authentication.
 *
 * Dev mode: Quick user selection without credentials (uses /auth/token proxy to user-service /dev/token)
 * OAuth mode: Standard authorization_code flow (future production use)
 */

export type AuthMode = 'dev' | 'oauth';

export interface AuthConfig {
  mode: AuthMode;
  /** Base URL for auth endpoints (proxied through nginx in Docker) */
  authUrl: string;
  /** OAuth client ID */
  clientId: string;
  /** OAuth redirect URI after authorization */
  redirectUri: string;
}

/**
 * Detect auth mode based on environment variables and runtime context.
 *
 * Dev mode is used when:
 * - Running in development (import.meta.env.DEV)
 * - VITE_AUTH_MODE is explicitly set to 'dev'
 * - Running on localhost
 */
export function getAuthConfig(): AuthConfig {
  const isDev = import.meta.env.DEV ||
                import.meta.env.VITE_AUTH_MODE === 'dev' ||
                window.location.hostname === 'localhost';

  if (isDev) {
    return {
      mode: 'dev',
      // /auth is proxied to user-service /dev by nginx
      authUrl: import.meta.env.VITE_AUTH_URL || '/auth',
      clientId: 'dev-client',
      redirectUri: `${window.location.origin}/callback`,
    };
  }

  return {
    mode: 'oauth',
    authUrl: import.meta.env.VITE_USER_SERVICE_URL || '/oauth2',
    clientId: 'ecommerce-web',
    redirectUri: `${window.location.origin}/callback`,
  };
}

export type UserType = 'CUSTOMER' | 'EMPLOYEE' | 'SERVICE_ACCOUNT';

export interface TestUser {
  username: string;
  userType: UserType;
  description: string;
  permissions: string[];
  storeNumber?: number;
}

/**
 * Pre-defined test users for dev mode quick selection.
 * These match the seeded users in user-service V003 migration.
 */
export const DEV_TEST_USERS: TestUser[] = [
  {
    username: 'dev-employee',
    userType: 'EMPLOYEE',
    description: 'Store employee with full admin access',
    permissions: ['read', 'write', 'admin', 'customer_search'],
    storeNumber: 1234,
  },
  {
    username: 'dev-customer',
    userType: 'CUSTOMER',
    description: 'Standard customer account',
    permissions: ['read', 'write'],
  },
  {
    username: 'dev-kiosk',
    userType: 'SERVICE_ACCOUNT',
    description: 'Self-checkout kiosk (read-only)',
    permissions: ['read'],
  },
];

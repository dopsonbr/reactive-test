import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { logger } from '../../../shared/utils/logger';
import { getAuthConfig, AuthConfig, UserType } from '../config';

export type { UserType } from '../config';

interface User {
  id: string;
  username: string;
  userType: UserType;
  permissions: string[];
  storeNumber?: number;
}

interface AuthContextValue {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  authConfig: AuthConfig;
  /** Dev mode: quick login with username (no password required) */
  loginDev: (username: string, userType?: UserType, storeNumber?: number) => Promise<void>;
  /** OAuth mode: redirect to authorization endpoint */
  loginOAuth: () => void;
  /** Handle OAuth callback with authorization code */
  handleOAuthCallback: (code: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// Keys for session storage
const AUTH_TOKEN_KEY = 'authToken';
const AUTH_USER_KEY = 'authUser';

interface DevTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  user_type: UserType;
  permissions: string[];
}

interface OAuthTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  scope?: string;
}

function loadUserFromStorage(): User | null {
  const savedUser = sessionStorage.getItem(AUTH_USER_KEY);
  if (savedUser) {
    try {
      return JSON.parse(savedUser);
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * Parse JWT token to extract user claims.
 */
function parseTokenClaims(token: string): User | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return {
      id: payload.sub || payload.user_id || '',
      username: payload.username || payload.sub || '',
      userType: (payload.user_type || 'CUSTOMER') as UserType,
      permissions: payload.permissions || (payload.scope || '').split(' ').filter(Boolean),
      storeNumber: payload.store_number,
    };
  } catch {
    return null;
  }
}

/**
 * Generate random state for OAuth CSRF protection.
 */
function generateState(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authConfig] = useState(() => getAuthConfig());
  const [token, setToken] = useState<string | null>(() => {
    return sessionStorage.getItem(AUTH_TOKEN_KEY);
  });
  const [user, setUser] = useState<User | null>(() => loadUserFromStorage());
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Dev mode login: POST to /auth/token (proxied to user-service /dev/token)
   * No password required - creates fake user if not exists.
   */
  const loginDev = useCallback(async (
    username: string,
    userType?: UserType,
    storeNumber?: number
  ) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${authConfig.authUrl}/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          userType: userType || 'CUSTOMER',
          storeNumber: storeNumber || null,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Login failed' }));
        throw new Error(error.message || error.error_description || 'Login failed');
      }

      const data: DevTokenResponse = await response.json();
      const accessToken = data.access_token;

      // Parse claims from token or use response data
      const claims = parseTokenClaims(accessToken);
      const loggedInUser: User = claims || {
        id: '',
        username,
        userType: data.user_type || (userType as UserType) || 'CUSTOMER',
        permissions: data.permissions || [],
        storeNumber,
      };

      // Store token and user
      sessionStorage.setItem(AUTH_TOKEN_KEY, accessToken);
      sessionStorage.setItem(AUTH_USER_KEY, JSON.stringify(loggedInUser));
      setToken(accessToken);
      setUser(loggedInUser);

      logger.info('Dev login successful', { username: loggedInUser.username, userType: loggedInUser.userType });
    } catch (error) {
      logger.error('Dev login failed', error instanceof Error ? error : new Error(String(error)));
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [authConfig]);

  /**
   * OAuth mode login: Redirect to authorization endpoint.
   * Used for production authorization_code flow.
   */
  const loginOAuth = useCallback(() => {
    const state = generateState();
    sessionStorage.setItem('oauth_state', state);

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: authConfig.clientId,
      redirect_uri: authConfig.redirectUri,
      scope: 'openid profile read write',
      state,
    });

    window.location.href = `${authConfig.authUrl}/authorize?${params}`;
  }, [authConfig]);

  /**
   * Handle OAuth callback: Exchange authorization code for tokens.
   */
  const handleOAuthCallback = useCallback(async (code: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${authConfig.authUrl}/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          redirect_uri: authConfig.redirectUri,
          client_id: authConfig.clientId,
        }),
      });

      if (!response.ok) {
        throw new Error('Token exchange failed');
      }

      const data: OAuthTokenResponse = await response.json();
      const accessToken = data.access_token;
      const claims = parseTokenClaims(accessToken);

      if (!claims) {
        throw new Error('Failed to parse token claims');
      }

      sessionStorage.setItem(AUTH_TOKEN_KEY, accessToken);
      sessionStorage.setItem(AUTH_USER_KEY, JSON.stringify(claims));
      setToken(accessToken);
      setUser(claims);

      // Clean up OAuth state
      sessionStorage.removeItem('oauth_state');

      logger.info('OAuth login successful', { username: claims.username });
    } catch (error) {
      logger.error('OAuth callback failed', error instanceof Error ? error : new Error(String(error)));
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [authConfig]);

  const logout = useCallback(() => {
    sessionStorage.removeItem(AUTH_TOKEN_KEY);
    sessionStorage.removeItem(AUTH_USER_KEY);
    sessionStorage.removeItem('oauth_state');
    setToken(null);
    setUser(null);
    logger.info('User logged out');
  }, []);

  const value: AuthContextValue = {
    isAuthenticated: !!token,
    user,
    token,
    authConfig,
    loginDev,
    loginOAuth,
    handleOAuthCallback,
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

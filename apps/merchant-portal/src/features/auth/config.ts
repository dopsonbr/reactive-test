export type AuthMode = 'dev' | 'oauth';

export interface AuthConfig {
  mode: AuthMode;
  authUrl: string;
  clientId: string;
  redirectUri: string;
}

export function getAuthConfig(): AuthConfig {
  return {
    mode: 'dev',
    authUrl: import.meta.env.VITE_AUTH_URL || '/auth',
    clientId: 'merchant-portal',
    redirectUri: `${window.location.origin}/callback`,
  };
}

export const MERCHANT_ROLES = ['MERCHANT', 'PRICING_SPECIALIST', 'INVENTORY_SPECIALIST', 'ADMIN'];

export const DEV_TEST_USERS = [
  {
    username: 'merchant1',
    description: 'Product management',
    permissions: ['read', 'write', 'merchant'],
  },
  {
    username: 'pricer1',
    description: 'Price management',
    permissions: ['read', 'write', 'pricing_specialist'],
  },
  {
    username: 'inventory1',
    description: 'Inventory management',
    permissions: ['read', 'write', 'inventory_specialist'],
  },
  {
    username: 'admin1',
    description: 'Full access',
    permissions: ['read', 'write', 'admin', 'merchant', 'pricing_specialist', 'inventory_specialist'],
  },
];

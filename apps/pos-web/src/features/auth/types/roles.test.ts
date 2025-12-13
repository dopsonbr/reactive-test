import { describe, it, expect } from 'vitest';
import {
  hasPermission,
  getMarkdownTier,
  UserRole,
  Permission,
  ROLE_PERMISSIONS,
} from './roles';

describe('roles permission functions', () => {
  describe('hasPermission', () => {
    describe('ASSOCIATE role', () => {
      it('has TRANSACTION_CREATE permission', () => {
        expect(hasPermission(UserRole.ASSOCIATE, Permission.TRANSACTION_CREATE)).toBe(true);
      });

      it('does NOT have TRANSACTION_VOID permission', () => {
        expect(hasPermission(UserRole.ASSOCIATE, Permission.TRANSACTION_VOID)).toBe(false);
      });

      it('has MARKDOWN_APPLY permission', () => {
        expect(hasPermission(UserRole.ASSOCIATE, Permission.MARKDOWN_APPLY)).toBe(true);
      });

      it('does NOT have MARKDOWN_OVERRIDE permission', () => {
        expect(hasPermission(UserRole.ASSOCIATE, Permission.MARKDOWN_OVERRIDE)).toBe(false);
      });
    });

    describe('SUPERVISOR role', () => {
      it('has TRANSACTION_VOID permission', () => {
        expect(hasPermission(UserRole.SUPERVISOR, Permission.TRANSACTION_VOID)).toBe(true);
      });

      it('has CUSTOMER_EDIT permission', () => {
        expect(hasPermission(UserRole.SUPERVISOR, Permission.CUSTOMER_EDIT)).toBe(true);
      });

      it('does NOT have CUSTOMER_DELETE permission', () => {
        expect(hasPermission(UserRole.SUPERVISOR, Permission.CUSTOMER_DELETE)).toBe(false);
      });
    });

    describe('MANAGER role', () => {
      it('has MARKDOWN_OVERRIDE permission', () => {
        expect(hasPermission(UserRole.MANAGER, Permission.MARKDOWN_OVERRIDE)).toBe(true);
      });

      it('has ORDER_REFUND permission', () => {
        expect(hasPermission(UserRole.MANAGER, Permission.ORDER_REFUND)).toBe(true);
      });

      it('has CUSTOMER_DELETE permission', () => {
        expect(hasPermission(UserRole.MANAGER, Permission.CUSTOMER_DELETE)).toBe(true);
      });
    });

    describe('ADMIN role', () => {
      it('has all permissions', () => {
        const allPermissions = Object.values(Permission);
        allPermissions.forEach((permission) => {
          expect(hasPermission(UserRole.ADMIN, permission)).toBe(true);
        });
      });
    });

    describe('CONTACT_CENTER role', () => {
      it('has CUSTOMER_EDIT but not CUSTOMER_DELETE', () => {
        expect(hasPermission(UserRole.CONTACT_CENTER, Permission.CUSTOMER_EDIT)).toBe(true);
        expect(hasPermission(UserRole.CONTACT_CENTER, Permission.CUSTOMER_DELETE)).toBe(false);
      });

      it('does NOT have MARKDOWN_APPLY permission', () => {
        expect(hasPermission(UserRole.CONTACT_CENTER, Permission.MARKDOWN_APPLY)).toBe(false);
      });
    });

    describe('B2B_SALES role', () => {
      it('has B2B_NET_TERMS permission', () => {
        expect(hasPermission(UserRole.B2B_SALES, Permission.B2B_NET_TERMS)).toBe(true);
      });

      it('has B2B_ACCOUNT_MANAGE permission', () => {
        expect(hasPermission(UserRole.B2B_SALES, Permission.B2B_ACCOUNT_MANAGE)).toBe(true);
      });

      it('does NOT have ADMIN_SETTINGS permission', () => {
        expect(hasPermission(UserRole.B2B_SALES, Permission.ADMIN_SETTINGS)).toBe(false);
      });
    });
  });

  describe('getMarkdownTier', () => {
    it('returns ASSOCIATE for ASSOCIATE role', () => {
      expect(getMarkdownTier(UserRole.ASSOCIATE)).toBe('ASSOCIATE');
    });

    it('returns SUPERVISOR for SUPERVISOR role', () => {
      expect(getMarkdownTier(UserRole.SUPERVISOR)).toBe('SUPERVISOR');
    });

    it('returns MANAGER for MANAGER role', () => {
      expect(getMarkdownTier(UserRole.MANAGER)).toBe('MANAGER');
    });

    it('returns ADMIN for ADMIN role', () => {
      expect(getMarkdownTier(UserRole.ADMIN)).toBe('ADMIN');
    });

    it('returns ASSOCIATE (downgraded) for CONTACT_CENTER role', () => {
      expect(getMarkdownTier(UserRole.CONTACT_CENTER)).toBe('ASSOCIATE');
    });

    it('returns ASSOCIATE (downgraded) for B2B_SALES role', () => {
      expect(getMarkdownTier(UserRole.B2B_SALES)).toBe('ASSOCIATE');
    });
  });

  describe('ROLE_PERMISSIONS consistency', () => {
    it('all roles have at least one permission', () => {
      Object.values(UserRole).forEach((role) => {
        expect(ROLE_PERMISSIONS[role].length).toBeGreaterThan(0);
      });
    });

    it('ADMIN has all permissions defined in Permission enum', () => {
      const adminPermissions = ROLE_PERMISSIONS[UserRole.ADMIN];
      const allPermissions = Object.values(Permission);
      expect(adminPermissions).toEqual(expect.arrayContaining(allPermissions));
    });
  });
});

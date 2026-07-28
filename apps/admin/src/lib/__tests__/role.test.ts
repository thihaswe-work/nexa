import {
  Role,
  Permission,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  ROLE_PERMISSIONS,
} from '@/types/role';

describe('Role Permissions', () => {
  describe('hasPermission', () => {
    it('should grant super_admin all permissions', () => {
      Object.values(Permission).forEach((permission) => {
        expect(hasPermission(Role.SUPER_ADMIN, permission)).toBe(true);
      });
    });

    it('should grant admin dashboard:view', () => {
      expect(hasPermission(Role.ADMIN, Permission.DASHBOARD_VIEW)).toBe(true);
    });

    it('should grant admin users:view', () => {
      expect(hasPermission(Role.ADMIN, Permission.USERS_VIEW)).toBe(true);
    });

    it('should not grant moderator users:create', () => {
      expect(hasPermission(Role.MODERATOR, Permission.USERS_CREATE)).toBe(false);
    });

    it('should not grant support users:edit', () => {
      expect(hasPermission(Role.SUPPORT, Permission.USERS_EDIT)).toBe(false);
    });

    it('should return false for unknown role', () => {
      expect(hasPermission('unknown_role', Permission.DASHBOARD_VIEW)).toBe(false);
    });

    it('should not grant support analytics:view', () => {
      expect(hasPermission(Role.SUPPORT, Permission.ANALYTICS_VIEW)).toBe(false);
    });
  });

  describe('hasAnyPermission', () => {
    it('should return true if user has at least one permission', () => {
      expect(
        hasAnyPermission(Role.ADMIN, [
          Permission.USERS_VIEW,
          Permission.SETTINGS_MANAGE,
        ]),
      ).toBe(true);
    });

    it('should return false if user has none of the permissions', () => {
      expect(
        hasAnyPermission(Role.SUPPORT, [
          Permission.USERS_CREATE,
          Permission.SETTINGS_MANAGE,
        ]),
      ).toBe(false);
    });
  });

  describe('hasAllPermissions', () => {
    it('should return true if user has all permissions', () => {
      expect(
        hasAllPermissions(Role.ADMIN, [
          Permission.DASHBOARD_VIEW,
          Permission.USERS_VIEW,
        ]),
      ).toBe(true);
    });

    it('should return false if user lacks one permission', () => {
      expect(
        hasAllPermissions(Role.MODERATOR, [
          Permission.DASHBOARD_VIEW,
          Permission.USERS_CREATE,
        ]),
      ).toBe(false);
    });
  });

  describe('ROLE_PERMISSIONS matrix', () => {
    it('should have entries for all roles', () => {
      Object.values(Role).forEach((role) => {
        expect(ROLE_PERMISSIONS[role]).toBeDefined();
        expect(Array.isArray(ROLE_PERMISSIONS[role])).toBe(true);
      });
    });

    it('should have super_admin with all permissions', () => {
      expect(ROLE_PERMISSIONS[Role.SUPER_ADMIN].length).toBe(Object.values(Permission).length);
    });

    it('should have admin with more permissions than moderator', () => {
      expect(ROLE_PERMISSIONS[Role.ADMIN].length).toBeGreaterThan(
        ROLE_PERMISSIONS[Role.MODERATOR].length,
      );
    });

    it('should have moderator with more permissions than support', () => {
      expect(ROLE_PERMISSIONS[Role.MODERATOR].length).toBeGreaterThan(
        ROLE_PERMISSIONS[Role.SUPPORT].length,
      );
    });
  });
});

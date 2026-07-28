export enum Role {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  MODERATOR = 'moderator',
  SUPPORT = 'support',
}

export enum Permission {
  DASHBOARD_VIEW = 'dashboard:view',
  USERS_VIEW = 'users:view',
  USERS_CREATE = 'users:create',
  USERS_EDIT = 'users:edit',
  USERS_DELETE = 'users:delete',
  LOCATIONS_VIEW = 'locations:view',
  LOCATIONS_MANAGE = 'locations:manage',
  PLACES_VIEW = 'places:view',
  PLACES_MANAGE = 'places:manage',
  ANALYTICS_VIEW = 'analytics:view',
  SETTINGS_VIEW = 'settings:view',
  SETTINGS_MANAGE = 'settings:manage',
  REPORTS_VIEW = 'reports:view',
  REPORTS_MANAGE = 'reports:manage',
  AUDIT_VIEW = 'audit:view',
}

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  [Role.SUPER_ADMIN]: Object.values(Permission),
  [Role.ADMIN]: [
    Permission.DASHBOARD_VIEW,
    Permission.USERS_VIEW,
    Permission.USERS_CREATE,
    Permission.USERS_EDIT,
    Permission.USERS_DELETE,
    Permission.LOCATIONS_VIEW,
    Permission.LOCATIONS_MANAGE,
    Permission.PLACES_VIEW,
    Permission.PLACES_MANAGE,
    Permission.ANALYTICS_VIEW,
    Permission.SETTINGS_VIEW,
    Permission.SETTINGS_MANAGE,
    Permission.REPORTS_VIEW,
  ],
  [Role.MODERATOR]: [
    Permission.DASHBOARD_VIEW,
    Permission.USERS_VIEW,
    Permission.LOCATIONS_VIEW,
    Permission.PLACES_VIEW,
    Permission.PLACES_MANAGE,
    Permission.REPORTS_VIEW,
    Permission.REPORTS_MANAGE,
  ],
  [Role.SUPPORT]: [
    Permission.DASHBOARD_VIEW,
    Permission.USERS_VIEW,
    Permission.REPORTS_VIEW,
  ],
};

export function hasPermission(role: string, permission: Permission): boolean {
  const roleEnum = Object.values(Role).find((r) => r === role);
  if (!roleEnum) return false;
  return ROLE_PERMISSIONS[roleEnum]?.includes(permission) ?? false;
}

export function hasAnyPermission(role: string, permissions: Permission[]): boolean {
  return permissions.some((p) => hasPermission(role, p));
}

export function hasAllPermissions(role: string, permissions: Permission[]): boolean {
  return permissions.every((p) => hasPermission(role, p));
}

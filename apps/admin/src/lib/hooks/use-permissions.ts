'use client';

import { useSession } from 'next-auth/react';
import {
  type Permission,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
} from '@/types/role';

export function usePermissions() {
  const { data: session } = useSession();
  const role = session?.user?.role ?? '';

  return {
    role,
    can: (permission: Permission) => hasPermission(role, permission),
    canAny: (permissions: Permission[]) => hasAnyPermission(role, permissions),
    canAll: (permissions: Permission[]) => hasAllPermissions(role, permissions),
  };
}

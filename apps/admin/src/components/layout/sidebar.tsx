'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { usePermissions } from '@/lib/hooks/use-permissions';
import { Permission, Role } from '@/types/role';
import { cn } from '@/lib/utils/cn';
import { ChevronDown, ChevronRight, Compass } from 'lucide-react';
import {
  LayoutDashboard,
  Users,
  BarChart3,
  Settings,
  Flag,
  ScrollText,
  Shield,
  Ban,
  MessageSquare,
  Megaphone,
  Activity,
  UserPlus,
  Globe,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useState } from 'react';

interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
  permissions?: Permission[];
  roles?: Role[];
}

interface NavGroup {
  name: string;
  icon: LucideIcon;
  children: NavItem[];
  permissions?: Permission[];
  roles?: Role[];
}

type NavEntry = NavItem | NavGroup;

function isGroup(entry: NavEntry): entry is NavGroup {
  return 'children' in entry;
}

const navigation: (NavItem | NavGroup)[] = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, permissions: [Permission.DASHBOARD_VIEW] },
  { name: 'Users', href: '/dashboard/users', icon: Users, permissions: [Permission.USERS_VIEW] },
  {
    name: 'Moderation',
    icon: Shield,
    permissions: [Permission.REPORTS_VIEW],
    children: [
      { name: 'Reports', href: '/dashboard/moderation/reports', icon: Flag, permissions: [Permission.REPORTS_VIEW] },
      { name: 'Blocks', href: '/dashboard/moderation/blocks', icon: Ban, permissions: [Permission.REPORTS_VIEW] },
      { name: 'Content Review', href: '/dashboard/moderation/content', icon: MessageSquare, permissions: [Permission.REPORTS_VIEW] },
    ],
  },
  {
    name: 'Analytics',
    icon: BarChart3,
    permissions: [Permission.ANALYTICS_VIEW],
    children: [
      { name: 'Overview', href: '/dashboard/analytics', icon: Activity, permissions: [Permission.ANALYTICS_VIEW] },
      { name: 'Active Users', href: '/dashboard/analytics/users', icon: Users, permissions: [Permission.ANALYTICS_VIEW] },
      { name: 'Registrations', href: '/dashboard/analytics/registrations', icon: UserPlus, permissions: [Permission.ANALYTICS_VIEW] },
      { name: 'Locations', href: '/dashboard/analytics/locations', icon: Globe, permissions: [Permission.ANALYTICS_VIEW] },
    ],
  },
  {
    name: 'System',
    icon: Settings,
    children: [
      { name: 'Announcements', href: '/dashboard/system/announcements', icon: Megaphone },
      { name: 'Settings', href: '/dashboard/system/settings', icon: Settings, permissions: [Permission.SETTINGS_VIEW] },
      { name: 'Audit Log', href: '/dashboard/system/audit', icon: ScrollText, permissions: [Permission.AUDIT_VIEW] },
    ],
  },
];

const adminOnlyItems: NavItem[] = [
  { name: 'Roles', href: '/dashboard/roles', icon: Shield, roles: [Role.SUPER_ADMIN] },
];

function NavItemLink({ item, isActive, depth = 0 }: { item: NavItem; isActive: boolean; depth?: number }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      className={cn(
        'sidebar-nav-item',
        isActive ? 'sidebar-nav-item-active' : 'sidebar-nav-item-inactive',
        depth > 0 && 'ml-8',
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span>{item.name}</span>
      {isActive && <div className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />}
    </Link>
  );
}

function NavGroupItem({ group, pathname }: { group: NavGroup; pathname: string }) {
  const { can, role } = usePermissions();
  const [open, setOpen] = useState(
    group.children.some((c) => pathname.startsWith(c.href.split('/').slice(0, 3).join('/'))),
  );
  const Icon = group.icon;

  const filtered = group.children.filter((item) => {
    if (item.roles && !item.roles.includes(role as Role)) return false;
    if (item.permissions && !item.permissions.every((p) => can(p))) return false;
    return true;
  });

  if (filtered.length === 0) return null;

  const anyActive = filtered.some((c) => pathname === c.href);

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          'sidebar-nav-item w-full',
          anyActive ? 'sidebar-nav-item-active' : 'sidebar-nav-item-inactive',
        )}
      >
        <Icon className="h-4 w-4 shrink-0" />
        <span className="flex-1 text-left">{group.name}</span>
        {open ? (
          <ChevronDown className="h-3.5 w-3.5 transition-transform duration-200" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5 transition-transform duration-200" />
        )}
      </button>
      <div className={cn('mt-1 space-y-0.5 overflow-hidden transition-all duration-200', open ? 'opacity-100' : 'opacity-0 h-0')}>
        {open && filtered.map((child, i) => (
          <div key={child.href} className="animate-in" style={{ animationDelay: `${i * 30}ms`, animationFillMode: 'backwards' }}>
            <NavItemLink key={child.href} item={child} isActive={pathname === child.href} depth={1} />
          </div>
        ))}
      </div>
    </div>
  );
}

export function SidebarContent() {
  const pathname = usePathname();
  const { can, role } = usePermissions();

  const filteredNav = navigation.filter((entry) => {
    if (isGroup(entry)) {
      if (entry.permissions && !entry.permissions.every((p) => can(p))) {
        const hasChild = entry.children.some((c) => {
          if (c.permissions && !c.permissions.every((p) => can(p))) return false;
          if (c.roles && !c.roles.includes(role as Role)) return false;
          return true;
        });
        return hasChild;
      }
      return true;
    }
    if (entry.permissions && !entry.permissions.every((p) => can(p))) return false;
    if (entry.roles && !entry.roles.includes(role as Role)) return false;
    return true;
  });

  const filteredAdmin = adminOnlyItems.filter((item) => {
    if (item.roles && !item.roles.includes(role as Role)) return false;
    return true;
  });

  return (
    <div className="space-y-1 px-3 py-2">
      {filteredNav.map((entry, i) => (
        <div key={'nav-' + i} className="animate-in" style={{ animationDelay: `${i * 50}ms`, animationFillMode: 'backwards' }}>
          {isGroup(entry) ? (
            <NavGroupItem key={entry.name} group={entry} pathname={pathname} />
          ) : (
            <NavItemLink key={entry.href} item={entry} isActive={pathname === entry.href} />
          )}
        </div>
      ))}
      {filteredAdmin.length > 0 && (
        <>
          <div className="relative my-3">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">Admin</span>
            </div>
          </div>
          {filteredAdmin.map((item) => (
            <NavItemLink key={item.href} item={item} isActive={pathname === item.href} />
          ))}
        </>
      )}
    </div>
  );
}

export function Sidebar() {
  return (
    <aside className="hidden w-64 flex-col border-r bg-card/50 backdrop-blur-sm lg:flex">
      <div className="flex h-16 items-center gap-2.5 border-b px-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
          <Compass className="h-4 w-4 text-primary-foreground" />
        </div>
        <Link href="/dashboard" className="text-lg font-bold tracking-tight">
          Nexa
          <span className="ml-1 font-normal text-muted-foreground">Admin</span>
        </Link>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto py-4">
        <SidebarContent />
      </nav>
      <div className="border-t p-4">
        <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
          Nexa v1.0.0
        </div>
      </div>
    </aside>
  );
}

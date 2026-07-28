'use client';

import { useDashboardStats, useRecentActivity } from '@/lib/hooks/use-admin';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Users,
  UserCheck,
  Ban,
  MapPin,
  Flag,
  AlertTriangle,
  UserPlus,
  Building2,
  TrendingUp,
  TrendingDown,
  Activity,
} from 'lucide-react';
import Link from 'next/link';

const statCards = [
  { key: 'totalUsers', label: 'Total Users', icon: Users, color: 'text-violet-600', bg: 'bg-violet-100 dark:bg-violet-900/20', change: '+12%', trend: 'up' },
  { key: 'activeUsers', label: 'Active Users', icon: UserCheck, color: 'text-emerald-600', bg: 'bg-emerald-100 dark:bg-emerald-900/20', change: '+5%', trend: 'up' },
  { key: 'bannedUsers', label: 'Banned', icon: Ban, color: 'text-red-600', bg: 'bg-red-100 dark:bg-red-900/20', change: '-2%', trend: 'down' },
  { key: 'totalLocations', label: 'Locations', icon: MapPin, color: 'text-sky-600', bg: 'bg-sky-100 dark:bg-sky-900/20', change: '+8%', trend: 'up' },
  { key: 'pendingReports', label: 'Pending Reports', icon: Flag, color: 'text-amber-600', bg: 'bg-amber-100 dark:bg-amber-900/20', change: '+3', trend: 'up' },
  { key: 'totalReports', label: 'Total Reports', icon: AlertTriangle, color: 'text-orange-600', bg: 'bg-orange-100 dark:bg-orange-900/20', change: '+15%', trend: 'up' },
  { key: 'newUsersToday', label: 'New Today', icon: UserPlus, color: 'text-sky-600', bg: 'bg-sky-100 dark:bg-sky-900/20', change: '+2', trend: 'up' },
  { key: 'totalPlaces', label: 'Places', icon: Building2, color: 'text-indigo-600', bg: 'bg-indigo-100 dark:bg-indigo-900/20', change: '0', trend: 'neutral' },
];

const quickLinks = [
  { href: '/dashboard/users', label: 'Manage Users', desc: 'View and manage user accounts', color: 'bg-violet-500' },
  { href: '/dashboard/moderation/reports', label: 'Review Reports', desc: 'Review user reports', color: 'bg-amber-500' },
  { href: '/dashboard/system/announcements', label: 'Send Announcement', desc: 'App-wide notifications', color: 'bg-emerald-500' },
  { href: '/dashboard/analytics', label: 'View Analytics', desc: 'Explore usage metrics', color: 'bg-sky-500' },
];

export default function DashboardPage() {
  const { data: stats, isLoading } = useDashboardStats();
  const { data: activities } = useRecentActivity();

  return (
    <div className="space-y-6 animate-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Overview of your application</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map(({ key, label, icon: Icon, color, bg, change, trend }) => (
          <div key={key} className="stat-card-hover rounded-xl border bg-card p-5">
            <div className="flex items-start justify-between">
              <div className={`rounded-lg p-2.5 ${bg}`}>
                <Icon className={`h-5 w-5 ${color}`} />
              </div>
              <span className={`flex items-center gap-0.5 text-xs font-medium ${
                trend === 'up' ? 'text-emerald-600' : trend === 'down' ? 'text-red-600' : 'text-muted-foreground'
              }`}>
                {trend === 'up' ? <TrendingUp className="h-3 w-3" /> : trend === 'down' ? <TrendingDown className="h-3 w-3" /> : null}
                {change}
              </span>
            </div>
            <div className="mt-3">
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <p className="stat-value">{String((stats as any)?.[key] ?? '—')}</p>
              )}
            </div>
            <p className="stat-label mt-1">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base font-semibold">Recent Activity</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full rounded-lg" />
                ))}
              </div>
            ) : !activities?.length ? (
              <div className="flex flex-col items-center py-8 text-center">
                <Activity className="mb-3 h-8 w-8 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">No recent activity</p>
              </div>
            ) : (
              <div className="space-y-1">
                {activities.map((a) => (
                  <div key={a.id} className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-muted/50">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <span className="text-xs font-medium text-primary">
                        {a.userName?.charAt(0)?.toUpperCase() || '?'}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="font-medium">{a.userName}</span>
                      <span className="ml-1 text-muted-foreground">{a.description}</span>
                    </div>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {new Date(a.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {quickLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="group flex items-start gap-3 rounded-lg border p-3 transition-all hover:bg-accent hover:shadow-sm"
              >
                <div className={`mt-0.5 h-3 w-3 shrink-0 rounded-full ${link.color}`} />
                <div className="min-w-0">
                  <p className="text-sm font-medium group-hover:text-accent-foreground">{link.label}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{link.desc}</p>
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

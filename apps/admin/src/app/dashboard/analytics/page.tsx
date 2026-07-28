'use client';

import { useActiveUsersAnalytics, useRegistrationAnalytics } from '@/lib/hooks/use-admin';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DateRangePicker } from '@/components/shared/date-range-picker';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, UserPlus, TrendingUp, MapPin, Activity, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

export default function AnalyticsPage() {
  const [range, setRange] = useState({ from: new Date(Date.now() - 30 * 86400000), to: new Date() });
  const rangeParam = { from: range.from.toISOString(), to: range.to.toISOString() };

  const active = useActiveUsersAnalytics(rangeParam);
  const registrations = useRegistrationAnalytics(rangeParam);

  const summaryCards = [
    {
      label: 'Current Active Users',
      value: active.data?.currentActive,
      icon: Users,
      color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/20',
      loading: active.isLoading,
    },
    {
      label: "Today's Peak",
      value: active.data?.peakToday,
      icon: TrendingUp,
      color: 'text-emerald-600', bg: 'bg-emerald-100 dark:bg-emerald-900/20',
      loading: active.isLoading,
    },
    {
      label: 'New This Week',
      value: registrations.data?.thisWeek,
      icon: UserPlus,
      color: 'text-violet-600', bg: 'bg-violet-100 dark:bg-violet-900/20',
      loading: registrations.isLoading,
    },
    {
      label: 'New This Month',
      value: registrations.data?.thisMonth,
      icon: UserPlus,
      color: 'text-sky-600', bg: 'bg-sky-100 dark:bg-sky-900/20',
      loading: registrations.isLoading,
    },
  ];

  return (
    <div className="space-y-6 animate-in">
      <PageHeader
        title="Analytics"
        description="Application metrics and trends"
        actions={<DateRangePicker value={range} onChange={setRange} />}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {summaryCards.map((card) => (
          <div key={card.label} className="stat-card-hover rounded-xl border bg-card p-5">
            <div className="flex items-start justify-between">
              <div className={`rounded-lg p-2.5 ${card.bg}`}>
                <card.icon className={`h-5 w-5 ${card.color}`} />
              </div>
            </div>
            <div className="mt-3">
              {card.loading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <p className="stat-value">{card.value ?? '—'}</p>
              )}
            </div>
            <p className="stat-label mt-1">{card.label}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Active Users</CardTitle>
          </CardHeader>
          <CardContent>
            <Link
              href="/dashboard/analytics/users"
              className="group flex h-[200px] flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/20 transition-colors hover:border-primary/30 hover:bg-accent/30"
            >
              <Activity className="mb-3 h-8 w-8 text-muted-foreground/40 group-hover:text-primary/60" />
              <p className="text-sm font-medium text-muted-foreground group-hover:text-primary">
                View Active Users Chart
              </p>
              <ArrowUpRight className="mt-1 h-4 w-4 text-muted-foreground/40 group-hover:text-primary/60" />
            </Link>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Registrations</CardTitle>
          </CardHeader>
          <CardContent>
            <Link
              href="/dashboard/analytics/registrations"
              className="group flex h-[200px] flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/20 transition-colors hover:border-primary/30 hover:bg-accent/30"
            >
              <UserPlus className="mb-3 h-8 w-8 text-muted-foreground/40 group-hover:text-primary/60" />
              <p className="text-sm font-medium text-muted-foreground group-hover:text-primary">
                View Registration Chart
              </p>
              <ArrowUpRight className="mt-1 h-4 w-4 text-muted-foreground/40 group-hover:text-primary/60" />
            </Link>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Location Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <Link
            href="/dashboard/analytics/locations"
            className="group flex h-[200px] flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/20 transition-colors hover:border-primary/30 hover:bg-accent/30"
          >
            <MapPin className="mb-3 h-8 w-8 text-muted-foreground/40 group-hover:text-primary/60" />
            <p className="text-sm font-medium text-muted-foreground group-hover:text-primary">
              View Location Heatmap
            </p>
            <ArrowUpRight className="mt-1 h-4 w-4 text-muted-foreground/40 group-hover:text-primary/60" />
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}

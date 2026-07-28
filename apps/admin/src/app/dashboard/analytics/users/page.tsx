'use client';

import { useState } from 'react';
import { useActiveUsersAnalytics } from '@/lib/hooks/use-admin';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DateRangePicker } from '@/components/shared/date-range-picker';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, TrendingUp, CalendarDays } from 'lucide-react';

export default function ActiveUsersPage() {
  const [range, setRange] = useState({ from: new Date(Date.now() - 30 * 86400000), to: new Date() });
  const { data, isLoading } = useActiveUsersAnalytics({
    from: range.from.toISOString(),
    to: range.to.toISOString(),
  });

  const metrics = [
    { title: 'Daily Active Users', value: data?.daily?.at(-1)?.value, icon: Users, color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/20' },
    { title: 'Weekly Active Users', value: data?.weekly?.at(-1)?.value, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-100 dark:bg-emerald-900/20' },
    { title: 'Monthly Active Users', value: data?.monthly?.at(-1)?.value, icon: CalendarDays, color: 'text-violet-600', bg: 'bg-violet-100 dark:bg-violet-900/20' },
  ];

  const maxValue = Math.max(...(data?.daily ?? []).map(d => d.value), 1);

  return (
    <div className="space-y-6 animate-in">
      <PageHeader
        title="Active Users"
        description="Daily, weekly, and monthly active user metrics"
        actions={<DateRangePicker value={range} onChange={setRange} />}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        {metrics.map((m) => (
          <div key={m.title} className="stat-card-hover rounded-xl border bg-card p-5">
            <div className="flex items-start justify-between">
              <div className={`rounded-lg p-2.5 ${m.bg}`}>
                <m.icon className={`h-5 w-5 ${m.color}`} />
              </div>
            </div>
            <div className="mt-3">
              {isLoading ? <Skeleton className="h-8 w-16" /> : <p className="text-3xl font-bold">{m.value ?? '—'}</p>}
            </div>
            <p className="stat-label mt-1">{m.title}</p>
          </div>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Daily Active Users</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-[300px]" />
          ) : !data?.daily?.length ? (
            <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
              No data available for this period
            </div>
          ) : (
            <div className="space-y-2">
              {data.daily.slice(-30).map((d) => (
                <div key={d.date} className="flex items-center gap-3 text-sm">
                  <span className="w-24 shrink-0 text-muted-foreground">
                    {new Date(d.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </span>
                  <div className="flex-1">
                    <div className="h-6 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-primary/60 to-primary transition-all duration-500"
                        style={{ width: `${(d.value / maxValue) * 100}%` }}
                      />
                    </div>
                  </div>
                  <span className="w-12 shrink-0 text-right font-medium tabular-nums">{d.value}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

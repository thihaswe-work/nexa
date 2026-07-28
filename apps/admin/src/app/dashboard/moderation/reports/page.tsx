'use client';

import { useState, useCallback } from 'react';
import { useReports, useResolveReport } from '@/lib/hooks/use-admin';
import { PageHeader } from '@/components/shared/page-header';
import { SearchInput } from '@/components/shared/search-input';
import { DataTable, type Column } from '@/components/shared/data-table';
import { Pagination } from '@/components/shared/pagination';
import { StatusBadge } from '@/components/shared/status-badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Report } from '@/types/admin';

export default function ReportsPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(25);

  const { data, isLoading, error } = useReports({ page, limit: pageSize, search, status });
  const resolveMutation = useResolveReport();

  const handleSearch = useCallback((v: string) => { setSearch(v); setPage(1); }, []);

  const columns: Column<Report>[] = [
    { key: 'id', header: 'ID', cell: (r) => <span className="font-mono text-xs">{r.id.slice(0, 8)}</span> },
    {
      key: 'reporter',
      header: 'Reporter',
      cell: (r) => r.reporter.displayName,
    },
    {
      key: 'target',
      header: 'Target',
      cell: (r) => r.targetUser?.displayName ?? 'Deleted User',
    },
    { key: 'reason', header: 'Reason', cell: (r) => r.reason },
    {
      key: 'status',
      header: 'Status',
      cell: (r) => <StatusBadge status={r.status} />,
    },
    {
      key: 'date',
      header: 'Date',
      cell: (r) => new Date(r.createdAt).toLocaleDateString(),
    },
    {
      key: 'actions',
      header: '',
      cell: (r) =>
        r.status === 'pending' ? (
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="ghost"
              className="text-emerald-600"
              onClick={() => resolveMutation.mutate({ id: r.id, action: 'resolve' })}
            >
              Resolve
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-muted-foreground"
              onClick={() => resolveMutation.mutate({ id: r.id, action: 'dismiss' })}
            >
              Dismiss
            </Button>
          </div>
        ) : null,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Reports" description="User-generated reports" />

      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="flex-1">
          <SearchInput value={search} onChange={handleSearch} placeholder="Search reports..." />
        </div>
        <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="All status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="dismissed">Dismissed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DataTable
        columns={columns}
        data={data?.data ?? []}
        loading={isLoading}
        error={error?.message}
        keyExtractor={(r) => r.id}
      />

      {data && (
        <Pagination
          page={page}
          pageSize={pageSize}
          total={data.total}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}

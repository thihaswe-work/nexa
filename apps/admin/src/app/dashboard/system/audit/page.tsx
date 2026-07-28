'use client';

import { useState, useCallback } from 'react';
import { useAuditLogs } from '@/lib/hooks/use-admin';
import { PageHeader } from '@/components/shared/page-header';
import { DataTable, type Column } from '@/components/shared/data-table';
import { Pagination } from '@/components/shared/pagination';
import { SearchInput } from '@/components/shared/search-input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { AuditLog } from '@/types/admin';

export default function AuditLogPage() {
  const [search, setSearch] = useState('');
  const [action, setAction] = useState('');
  const [entity, setEntity] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(50);

  const { data, isLoading, error } = useAuditLogs({ page, limit: pageSize, search, action, entity });
  const handleSearch = useCallback((v: string) => { setSearch(v); setPage(1); }, []);

  const columns: Column<AuditLog>[] = [
    {
      key: 'action',
      header: 'Action',
      cell: (l) => <Badge variant="outline">{l.action}</Badge>,
    },
    { key: 'entity', header: 'Entity', cell: (l) => l.entity },
    { key: 'description', header: 'Description', cell: (l) => l.description },
    {
      key: 'user',
      header: 'Performed By',
      cell: (l) => l.performedBy?.username ?? 'System',
    },
    {
      key: 'date',
      header: 'Date',
      cell: (l) => (
        <span className="text-sm text-muted-foreground">
          {new Date(l.createdAt).toLocaleString()}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Audit Log" description="Track administrative actions" />

      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="flex-1">
          <SearchInput value={search} onChange={handleSearch} placeholder="Search audit logs..." />
        </div>
        <Select value={action} onValueChange={(v) => { setAction(v); setPage(1); }}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="All actions" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value=" ">All actions</SelectItem>
            <SelectItem value="create">Create</SelectItem>
            <SelectItem value="update">Update</SelectItem>
            <SelectItem value="delete">Delete</SelectItem>
            <SelectItem value="ban">Ban</SelectItem>
            <SelectItem value="unban">Unban</SelectItem>
          </SelectContent>
        </Select>
        <Select value={entity} onValueChange={(v) => { setEntity(v); setPage(1); }}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="All entities" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value=" ">All entities</SelectItem>
            <SelectItem value="user">User</SelectItem>
            <SelectItem value="report">Report</SelectItem>
            <SelectItem value="announcement">Announcement</SelectItem>
            <SelectItem value="settings">Settings</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DataTable
        columns={columns}
        data={data?.data ?? []}
        loading={isLoading}
        error={error?.message}
        keyExtractor={(l) => l.id}
      />

      {data && (
        <Pagination page={page} pageSize={pageSize} total={data.total} onPageChange={setPage} />
      )}
    </div>
  );
}

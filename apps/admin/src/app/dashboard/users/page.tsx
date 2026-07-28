'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useUsers, useBanUser, useUnbanUser, useDeleteUser } from '@/lib/hooks/use-admin';
import { PageHeader } from '@/components/shared/page-header';
import { SearchInput } from '@/components/shared/search-input';
import { DataTable, type Column } from '@/components/shared/data-table';
import { Pagination } from '@/components/shared/pagination';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { StatusBadge } from '@/components/shared/status-badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { AdminUser } from '@/types/admin';

export default function UsersPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const { data, isLoading, error } = useUsers({ page, limit: pageSize, search, role, status });
  const banMutation = useBanUser();
  const unbanMutation = useUnbanUser();
  const deleteMutation = useDeleteUser();
  const [confirmAction, setConfirmAction] = useState<{
    type: 'ban' | 'unban' | 'delete';
    user: AdminUser;
  } | null>(null);

  const handleSearch = useCallback((v: string) => { setSearch(v); setPage(1); }, []);

  const columns: Column<AdminUser>[] = [
    {
      key: 'user',
      header: 'User',
      cell: (u) => (
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-medium">
            {u.displayName?.[0] ?? u.username[0]}
          </div>
          <div>
            <p className="font-medium">{u.displayName || u.username}</p>
            <p className="text-xs text-muted-foreground">{u.email}</p>
          </div>
        </div>
      ),
    },
    { key: 'username', header: 'Username', cell: (u) => u.username },
    {
      key: 'role',
      header: 'Role',
      cell: (u) => <StatusBadge status={u.role} />,
    },
    {
      key: 'status',
      header: 'Status',
      cell: (u) => (
        <StatusBadge status={u.isActive ? 'active' : 'banned'} />
      ),
    },
    {
      key: 'online',
      header: 'Online',
      cell: (u) => (
        <div className={`h-2 w-2 rounded-full ${u.isOnline ? 'bg-emerald-500' : 'bg-gray-300'}`} />
      ),
    },
    { key: 'created', header: 'Joined', cell: (u) => new Date(u.createdAt).toLocaleDateString() },
    {
      key: 'actions',
      header: '',
      cell: (u) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/users/${u.id}`); }}>
            View
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => { e.stopPropagation(); setConfirmAction({ type: u.isActive ? 'ban' : 'unban', user: u }); }}
          >
            {u.isActive ? 'Ban' : 'Unban'}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive"
            onClick={(e) => { e.stopPropagation(); setConfirmAction({ type: 'delete', user: u }); }}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Users" description="Manage registered users" />

      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="flex-1">
          <SearchInput value={search} onChange={handleSearch} placeholder="Search by name, email, or username..." />
        </div>
        <Select value={role} onValueChange={(v) => { setRole(v); setPage(1); }}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="All roles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All roles</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="moderator">Moderator</SelectItem>
            <SelectItem value="user">User</SelectItem>
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="All status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="banned">Banned</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DataTable
        columns={columns}
        data={data?.data ?? []}
        loading={isLoading}
        error={error?.message}
        keyExtractor={(u) => u.id}
        onRowClick={(u) => router.push(`/dashboard/users/${u.id}`)}
      />

      {data && (
        <Pagination
          page={page}
          pageSize={pageSize}
          total={data.total}
          onPageChange={setPage}
          onPageSizeChange={(s) => { setPageSize(s); setPage(1); }}
        />
      )}

      <ConfirmDialog
        open={!!confirmAction}
        onOpenChange={() => setConfirmAction(null)}
        title={
          confirmAction?.type === 'delete'
            ? 'Delete User'
            : confirmAction?.type === 'ban'
              ? 'Ban User'
              : 'Unban User'
        }
        description={
          confirmAction?.type === 'delete'
            ? `Are you sure you want to delete ${confirmAction?.user.displayName}? This action cannot be undone.`
            : confirmAction?.type === 'ban'
              ? `Are you sure you want to ban ${confirmAction?.user.displayName}? They will lose access to the platform.`
              : `Are you sure you want to unban ${confirmAction?.user.displayName}?`
        }
        variant={confirmAction?.type === 'unban' ? 'default' : 'destructive'}
        confirmLabel={confirmAction?.type === 'delete' ? 'Delete' : confirmAction?.type === 'ban' ? 'Ban' : 'Unban'}
        loading={banMutation.isPending || deleteMutation.isPending}
        onConfirm={() => {
          if (!confirmAction) return;
          const { type, user } = confirmAction;
          if (type === 'ban') banMutation.mutate({ id: user.id });
          else if (type === 'unban') unbanMutation.mutate(user.id);
          else deleteMutation.mutate(user.id);
          setConfirmAction(null);
        }}
      />
    </div>
  );
}

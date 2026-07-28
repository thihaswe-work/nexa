'use client';

import { useState, useCallback } from 'react';
import { useBlocks, useRemoveBlock } from '@/lib/hooks/use-admin';
import { PageHeader } from '@/components/shared/page-header';
import { SearchInput } from '@/components/shared/search-input';
import { DataTable, type Column } from '@/components/shared/data-table';
import { Pagination } from '@/components/shared/pagination';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { Button } from '@/components/ui/button';
import type { Block } from '@/types/admin';

export default function BlocksPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(25);
  const [removeTarget, setRemoveTarget] = useState<Block | null>(null);

  const { data, isLoading, error } = useBlocks({ page, limit: pageSize, search });
  const removeMutation = useRemoveBlock();

  const handleSearch = useCallback((v: string) => { setSearch(v); setPage(1); }, []);

  const columns: Column<Block>[] = [
    {
      key: 'blocker',
      header: 'Blocked By',
      cell: (b) => b.blocker.displayName,
    },
    {
      key: 'blocked',
      header: 'Blocked User',
      cell: (b) => b.blocked.displayName,
    },
    {
      key: 'reason',
      header: 'Reason',
      cell: (b) => b.reason ?? '—',
    },
    {
      key: 'date',
      header: 'Date',
      cell: (b) => new Date(b.createdAt).toLocaleDateString(),
    },
    {
      key: 'actions',
      header: '',
      cell: (b) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setRemoveTarget(b)}
        >
          Remove
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Blocked Users" description="Users blocked by others" />

      <div className="max-w-sm">
        <SearchInput value={search} onChange={handleSearch} placeholder="Search blocked users..." />
      </div>

      <DataTable
        columns={columns}
        data={data?.data ?? []}
        loading={isLoading}
        error={error?.message}
        keyExtractor={(b) => b.id}
      />

      {data && (
        <Pagination
          page={page}
          pageSize={pageSize}
          total={data.total}
          onPageChange={setPage}
        />
      )}

      <ConfirmDialog
        open={!!removeTarget}
        onOpenChange={() => setRemoveTarget(null)}
        title="Remove Block"
        description={`Remove the block between ${removeTarget?.blocker.displayName} and ${removeTarget?.blocked.displayName}?`}
        confirmLabel="Remove"
        onConfirm={() => {
          if (removeTarget) removeMutation.mutate(removeTarget.id);
          setRemoveTarget(null);
        }}
      />
    </div>
  );
}

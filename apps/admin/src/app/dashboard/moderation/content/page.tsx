'use client';

import { useState } from 'react';
import { useContentItems, useRemoveContent } from '@/lib/hooks/use-admin';
import { PageHeader } from '@/components/shared/page-header';
import { DataTable, type Column } from '@/components/shared/data-table';
import { Pagination } from '@/components/shared/pagination';
import { StatusBadge } from '@/components/shared/status-badge';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { ContentItem } from '@/types/admin';

export default function ContentReviewPage() {
  const [type, setType] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(25);
  const [removeTarget, setRemoveTarget] = useState<ContentItem | null>(null);

  const { data, isLoading, error } = useContentItems({ page, limit: pageSize, type, status });
  const removeMutation = useRemoveContent();

  const columns: Column<ContentItem>[] = [
    { key: 'type', header: 'Type', cell: (c) => <Badge variant="outline">{c.type}</Badge> },
    {
      key: 'content',
      header: 'Content',
      cell: (c) => (
        <p className="max-w-md truncate text-sm">{c.content}</p>
      ),
    },
    { key: 'author', header: 'Author', cell: (c) => c.author.displayName },
    {
      key: 'flags',
      header: 'Flags',
      cell: (c) => (
        <span className={c.flags > 0 ? 'font-medium text-amber-600' : ''}>{c.flags}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (c) => <StatusBadge status={c.status} />,
    },
    {
      key: 'date',
      header: 'Created',
      cell: (c) => new Date(c.createdAt).toLocaleDateString(),
    },
    {
      key: 'actions',
      header: '',
      cell: (c) =>
        c.status !== 'removed' ? (
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive"
            onClick={() => setRemoveTarget(c)}
          >
            Remove
          </Button>
        ) : null,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Content Review" description="Flagged content requiring moderation" />

      <div className="flex gap-4">
        <Select value={type} onValueChange={(v) => { setType(v); setPage(1); }}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value=" ">All types</SelectItem>
            <SelectItem value="message">Message</SelectItem>
            <SelectItem value="profile">Profile</SelectItem>
            <SelectItem value="place">Place</SelectItem>
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="All status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value=" ">All status</SelectItem>
            <SelectItem value="flagged">Flagged</SelectItem>
            <SelectItem value="clean">Clean</SelectItem>
            <SelectItem value="removed">Removed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DataTable
        columns={columns}
        data={data?.data ?? []}
        loading={isLoading}
        error={error?.message}
        keyExtractor={(c) => c.id}
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
        title="Remove Content"
        description={`Are you sure you want to remove this ${removeTarget?.type}?`}
        variant="destructive"
        confirmLabel="Remove"
        onConfirm={() => {
          if (removeTarget) removeMutation.mutate(removeTarget.id);
          setRemoveTarget(null);
        }}
      />
    </div>
  );
}

'use client';

import { useState, useCallback } from 'react';
import { useAnnouncements, useCreateAnnouncement, usePublishAnnouncement, useDeleteAnnouncement } from '@/lib/hooks/use-admin';
import { PageHeader } from '@/components/shared/page-header';
import { SearchInput } from '@/components/shared/search-input';
import { DataTable, type Column } from '@/components/shared/data-table';
import { Pagination } from '@/components/shared/pagination';
import { StatusBadge } from '@/components/shared/status-badge';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Send, Trash2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Announcement } from '@/types/admin';

const announcementSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  content: z.string().min(1, 'Content is required'),
  priority: z.enum(['low', 'normal', 'high', 'critical']).default('normal'),
  status: z.enum(['draft', 'published']).default('draft'),
});

type AnnouncementForm = z.infer<typeof announcementSchema>;

export default function AnnouncementsPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(25);
  const [showCreate, setShowCreate] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Announcement | null>(null);

  const { data, isLoading, error } = useAnnouncements({ page, limit: pageSize, search });
  const createMutation = useCreateAnnouncement();
  const publishMutation = usePublishAnnouncement();
  const deleteMutation = useDeleteAnnouncement();

  const form = useForm<AnnouncementForm>({
    resolver: zodResolver(announcementSchema),
    defaultValues: { title: '', content: '', priority: 'normal', status: 'draft' },
  });

  const handleSearch = useCallback((v: string) => { setSearch(v); setPage(1); }, []);

  const onSubmit = (values: AnnouncementForm) => {
    createMutation.mutate(values, {
      onSuccess: () => { setShowCreate(false); form.reset(); },
    });
  };

  const columns: Column<Announcement>[] = [
    { key: 'title', header: 'Title', cell: (a) => <span className="font-medium">{a.title}</span> },
    { key: 'priority', header: 'Priority', cell: (a) => <StatusBadge status={a.priority} /> },
    { key: 'status', header: 'Status', cell: (a) => <StatusBadge status={a.status} /> },
    {
      key: 'sent',
      header: 'Sent',
      cell: (a) => a._count?.notifications ?? 0,
    },
    {
      key: 'date',
      header: 'Created',
      cell: (a) => new Date(a.createdAt).toLocaleDateString(),
    },
    {
      key: 'createdBy',
      header: 'By',
      cell: (a) => a.createdBy.username,
    },
    {
      key: 'actions',
      header: '',
      cell: (a) => (
        <div className="flex items-center gap-1">
          {a.status === 'draft' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => publishMutation.mutate(a.id)}
            >
              <Send className="h-3 w-3 mr-1" /> Publish
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive"
            onClick={() => setDeleteTarget(a)}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Announcements"
        description="Create and manage system announcements"
        actions={
          <Button onClick={() => setShowCreate(true)}>
            <Plus className="mr-2 h-4 w-4" /> New Announcement
          </Button>
        }
      />

      <div className="max-w-sm">
        <SearchInput value={search} onChange={handleSearch} placeholder="Search announcements..." />
      </div>

      <DataTable
        columns={columns}
        data={data?.data ?? []}
        loading={isLoading}
        error={error?.message}
        keyExtractor={(a) => a.id}
      />

      {data && (
        <Pagination page={page} pageSize={pageSize} total={data.total} onPageChange={setPage} />
      )}

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="sm:max-w-lg">
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <DialogHeader>
              <DialogTitle>New Announcement</DialogTitle>
              <DialogDescription>Send a notification to all users</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input id="title" {...form.register('title')} placeholder="Announcement title" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="content">Content</Label>
                <Textarea id="content" {...form.register('content')} placeholder="Announcement content..." rows={4} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select
                    value={form.watch('priority')}
                    onValueChange={(v) => form.setValue('priority', v as any)}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={form.watch('status')}
                    onValueChange={(v) => form.setValue('status', v as any)}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="published">Publish now</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Creating...' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={() => setDeleteTarget(null)}
        title="Delete Announcement"
        description={`Delete "${deleteTarget?.title}"?`}
        variant="destructive"
        confirmLabel="Delete"
        onConfirm={() => { if (deleteTarget) deleteMutation.mutate(deleteTarget.id); setDeleteTarget(null); }}
      />
    </div>
  );
}

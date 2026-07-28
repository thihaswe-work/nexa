import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import * as adminApi from '@/lib/api/admin';
import type {
  PaginationParams,
  CreateAnnouncementInput,
  SystemSettings,
} from '@/types/admin';

// ─── Dashboard ────────────────────────────────
export function useDashboardStats() {
  return useQuery({
    queryKey: ['admin', 'dashboard', 'stats'],
    queryFn: adminApi.fetchDashboardStats,
  });
}

export function useRecentActivity() {
  return useQuery({
    queryKey: ['admin', 'dashboard', 'activity'],
    queryFn: adminApi.fetchRecentActivity,
  });
}

// ─── Users ────────────────────────────────────
export function useUsers(
  params: PaginationParams & { role?: string; status?: string },
) {
  return useQuery({
    queryKey: ['admin', 'users', params],
    queryFn: () => adminApi.fetchUsers(params),
  });
}

export function useUserDetail(id: string) {
  return useQuery({
    queryKey: ['admin', 'users', id],
    queryFn: () => adminApi.fetchUserDetail(id),
    enabled: !!id,
  });
}

export function useBanUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      adminApi.banUser(id, reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'users'] });
      toast.success('User banned');
    },
    onError: () => toast.error('Failed to ban user'),
  });
}

export function useUnbanUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminApi.unbanUser(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'users'] });
      toast.success('User unbanned');
    },
    onError: () => toast.error('Failed to unban user'),
  });
}

export function useDeleteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminApi.deleteUser(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'users'] });
      toast.success('User deleted');
    },
    onError: () => toast.error('Failed to delete user'),
  });
}

// ─── Reports ──────────────────────────────────
export function useReports(params: PaginationParams & { status?: string }) {
  return useQuery({
    queryKey: ['admin', 'reports', params],
    queryFn: () => adminApi.fetchReports(params),
  });
}

export function useResolveReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, action }: { id: string; action: 'resolve' | 'dismiss' }) =>
      adminApi.resolveReport(id, action),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'reports'] });
      toast.success('Report updated');
    },
    onError: () => toast.error('Failed to update report'),
  });
}

// ─── Blocks ───────────────────────────────────
export function useBlocks(params: PaginationParams) {
  return useQuery({
    queryKey: ['admin', 'blocks', params],
    queryFn: () => adminApi.fetchBlocks(params),
  });
}

export function useRemoveBlock() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminApi.removeBlock(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'blocks'] });
      toast.success('Block removed');
    },
    onError: () => toast.error('Failed to remove block'),
  });
}

// ─── Content Review ───────────────────────────
export function useContentItems(params: PaginationParams & { type?: string; status?: string }) {
  return useQuery({
    queryKey: ['admin', 'content', params],
    queryFn: () => adminApi.fetchContentItems(params),
  });
}

export function useRemoveContent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminApi.removeContent(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'content'] });
      toast.success('Content removed');
    },
    onError: () => toast.error('Failed to remove content'),
  });
}

// ─── Analytics ────────────────────────────────
export function useActiveUsersAnalytics(range?: { from: string; to: string }) {
  return useQuery({
    queryKey: ['admin', 'analytics', 'active-users', range],
    queryFn: () => adminApi.fetchActiveUsersAnalytics(range),
  });
}

export function useRegistrationAnalytics(range?: { from: string; to: string }) {
  return useQuery({
    queryKey: ['admin', 'analytics', 'registrations', range],
    queryFn: () => adminApi.fetchRegistrationAnalytics(range),
  });
}

export function useLocationActivity() {
  return useQuery({
    queryKey: ['admin', 'analytics', 'locations'],
    queryFn: adminApi.fetchLocationActivity,
  });
}

// ─── Announcements ────────────────────────────
export function useAnnouncements(params: PaginationParams & { status?: string }) {
  return useQuery({
    queryKey: ['admin', 'announcements', params],
    queryFn: () => adminApi.fetchAnnouncements(params),
  });
}

export function useCreateAnnouncement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateAnnouncementInput) => adminApi.createAnnouncement(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'announcements'] });
      toast.success('Announcement created');
    },
    onError: () => toast.error('Failed to create announcement'),
  });
}

export function usePublishAnnouncement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminApi.publishAnnouncement(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'announcements'] });
      toast.success('Announcement published');
    },
    onError: () => toast.error('Failed to publish announcement'),
  });
}

export function useDeleteAnnouncement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminApi.deleteAnnouncement(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'announcements'] });
      toast.success('Announcement deleted');
    },
    onError: () => toast.error('Failed to delete announcement'),
  });
}

// ─── Audit Logs ───────────────────────────────
export function useAuditLogs(params: PaginationParams & { action?: string; entity?: string }) {
  return useQuery({
    queryKey: ['admin', 'audit-logs', params],
    queryFn: () => adminApi.fetchAuditLogs(params),
  });
}

// ─── System Settings ──────────────────────────
export function useSystemSettings() {
  return useQuery({
    queryKey: ['admin', 'settings'],
    queryFn: adminApi.fetchSystemSettings,
  });
}

export function useUpdateSystemSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (settings: Partial<SystemSettings>) =>
      adminApi.updateSystemSettings(settings),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'settings'] });
      toast.success('Settings updated');
    },
    onError: () => toast.error('Failed to update settings'),
  });
}

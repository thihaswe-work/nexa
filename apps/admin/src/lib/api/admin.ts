import apiClient from '@/lib/api/client';
import type {
  PaginationParams,
  PaginatedResponse,
  DashboardStats,
  ActivityItem,
  AdminUser,
  AdminUserDetail,
  Report,
  Block,
  ContentItem,
  ActiveUsersAnalytics,
  RegistrationAnalytics,
  LocationActivity,
  Announcement,
  CreateAnnouncementInput,
  AuditLog,
  SystemSettings,
} from '@/types/admin';

const ADMIN_BASE = '/admin';

// ─── Helpers ──────────────────────────────────
function buildQuery(params: Record<string, any>): string {
  const search = new URLSearchParams();
  if (params.page) search.set('page', String(params.page));
  if (params.limit) search.set('limit', String(params.limit));
  if (params.search) search.set('search', params.search);
  if (params.sort) search.set('sort', params.sort);
  if (params.order) search.set('order', params.order);
  Object.entries(params).forEach(([k, v]) => {
    if (!['page', 'limit', 'search', 'sort', 'order'].includes(k) && v !== undefined && v !== '') {
      search.set(k, String(v));
    }
  });
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

// ─── Dashboard ────────────────────────────────
export async function fetchDashboardStats(): Promise<DashboardStats> {
  const { data } = await apiClient.get(`${ADMIN_BASE}/stats`);
  return data;
}

export async function fetchRecentActivity(): Promise<ActivityItem[]> {
  const { data } = await apiClient.get(`${ADMIN_BASE}/activity`);
  return data;
}

// ─── Users ────────────────────────────────────
export async function fetchUsers(
  params: PaginationParams & { role?: string; status?: string },
): Promise<PaginatedResponse<AdminUser>> {
  const { data } = await apiClient.get(`${ADMIN_BASE}/users${buildQuery(params)}`);
  return data;
}

export async function fetchUserDetail(id: string): Promise<AdminUserDetail> {
  const { data } = await apiClient.get(`${ADMIN_BASE}/users/${id}`);
  return data;
}

export async function banUser(id: string, reason?: string): Promise<void> {
  await apiClient.patch(`${ADMIN_BASE}/users/${id}/ban`, { reason });
}

export async function unbanUser(id: string): Promise<void> {
  await apiClient.patch(`${ADMIN_BASE}/users/${id}/unban`);
}

export async function deleteUser(id: string): Promise<void> {
  await apiClient.delete(`${ADMIN_BASE}/users/${id}`);
}

// ─── Moderation ───────────────────────────────
export async function fetchReports(
  params: PaginationParams & { status?: string },
): Promise<PaginatedResponse<Report>> {
  const { data } = await apiClient.get(`${ADMIN_BASE}/reports${buildQuery(params)}`);
  return data;
}

export async function resolveReport(id: string, action: 'resolve' | 'dismiss'): Promise<void> {
  await apiClient.patch(`${ADMIN_BASE}/reports/${id}`, { action });
}

export async function fetchBlocks(
  params: PaginationParams,
): Promise<PaginatedResponse<Block>> {
  const { data } = await apiClient.get(`${ADMIN_BASE}/blocks${buildQuery(params)}`);
  return data;
}

export async function removeBlock(id: string): Promise<void> {
  await apiClient.delete(`${ADMIN_BASE}/blocks/${id}`);
}

export async function fetchContentItems(
  params: PaginationParams & { type?: string; status?: string },
): Promise<PaginatedResponse<ContentItem>> {
  const { data } = await apiClient.get(`${ADMIN_BASE}/content${buildQuery(params)}`);
  return data;
}

export async function removeContent(id: string): Promise<void> {
  await apiClient.delete(`${ADMIN_BASE}/content/${id}`);
}

// ─── Analytics ────────────────────────────────
export async function fetchActiveUsersAnalytics(
  range?: { from: string; to: string },
): Promise<ActiveUsersAnalytics> {
  const params = range ? `?from=${range.from}&to=${range.to}` : '';
  const { data } = await apiClient.get(`${ADMIN_BASE}/analytics/active-users${params}`);
  return data;
}

export async function fetchRegistrationAnalytics(
  range?: { from: string; to: string },
): Promise<RegistrationAnalytics> {
  const params = range ? `?from=${range.from}&to=${range.to}` : '';
  const { data } = await apiClient.get(`${ADMIN_BASE}/analytics/registrations${params}`);
  return data;
}

export async function fetchLocationActivity(): Promise<LocationActivity[]> {
  const { data } = await apiClient.get(`${ADMIN_BASE}/analytics/locations`);
  return data;
}

// ─── Announcements ────────────────────────────
export async function fetchAnnouncements(
  params: PaginationParams & { status?: string },
): Promise<PaginatedResponse<Announcement>> {
  const { data } = await apiClient.get(`${ADMIN_BASE}/announcements${buildQuery(params)}`);
  return data;
}

export async function createAnnouncement(input: CreateAnnouncementInput): Promise<Announcement> {
  const { data } = await apiClient.post(`${ADMIN_BASE}/announcements`, input);
  return data;
}

export async function publishAnnouncement(id: string): Promise<void> {
  await apiClient.post(`${ADMIN_BASE}/announcements/${id}/publish`);
}

export async function deleteAnnouncement(id: string): Promise<void> {
  await apiClient.delete(`${ADMIN_BASE}/announcements/${id}`);
}

// ─── Audit Logs ───────────────────────────────
export async function fetchAuditLogs(
  params: PaginationParams & { action?: string; entity?: string },
): Promise<PaginatedResponse<AuditLog>> {
  const { data } = await apiClient.get(`${ADMIN_BASE}/audit-logs${buildQuery(params)}`);
  return data;
}

// ─── System Settings ──────────────────────────
export async function fetchSystemSettings(): Promise<SystemSettings> {
  const { data } = await apiClient.get(`${ADMIN_BASE}/settings`);
  return data;
}

export async function updateSystemSettings(
  settings: Partial<SystemSettings>,
): Promise<SystemSettings> {
  const { data } = await apiClient.patch(`${ADMIN_BASE}/settings`, settings);
  return data;
}

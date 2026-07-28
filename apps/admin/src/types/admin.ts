// ─── Pagination ───────────────────────────────
export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ─── Dashboard ────────────────────────────────
export interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  bannedUsers: number;
  totalLocations: number;
  totalReports: number;
  pendingReports: number;
  newUsersToday: number;
  totalPlaces: number;
}

export interface ActivityItem {
  id: string;
  type: string;
  description: string;
  userId: string;
  userName: string;
  createdAt: string;
}

// ─── Admin User ───────────────────────────────
export interface AdminUser {
  id: string;
  username: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  role: string;
  isActive: boolean;
  isOnline: boolean;
  emailVerified: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  _count?: {
    messages: number;
    friends: number;
    reports: number;
  };
}

export interface AdminUserDetail extends AdminUser {
  bio?: string;
  phoneNumber?: string;
  interests: { id: string; name: string; category: string }[];
  privacySettings: {
    showLastSeen: boolean;
    showOnline: boolean;
    showLocation: boolean;
  };
  locationHistory?: { lat: number; lng: number; updatedAt: string }[];
  recentReports?: Report[];
}

// ─── Report ───────────────────────────────────
export interface Report {
  id: string;
  reason: string;
  description: string | null;
  status: 'pending' | 'resolved' | 'dismissed';
  createdAt: string;
  resolvedAt: string | null;
  reporter: {
    id: string;
    username: string;
    displayName: string;
  };
  targetUser: {
    id: string;
    username: string;
    displayName: string;
  };
  resolvedBy?: {
    id: string;
    username: string;
  };
}

// ─── Block ────────────────────────────────────
export interface Block {
  id: string;
  reason: string | null;
  createdAt: string;
  blocker: {
    id: string;
    username: string;
    displayName: string;
  };
  blocked: {
    id: string;
    username: string;
    displayName: string;
  };
}

// ─── Content Review ───────────────────────────
export interface ContentItem {
  id: string;
  type: 'message' | 'profile' | 'place';
  content: string;
  author: { id: string; username: string; displayName: string };
  flags: number;
  status: 'clean' | 'flagged' | 'removed';
  createdAt: string;
}

// ─── Analytics ────────────────────────────────
export interface AnalyticsDataPoint {
  date: string;
  value: number;
}

export interface ActiveUsersAnalytics {
  daily: AnalyticsDataPoint[];
  weekly: AnalyticsDataPoint[];
  monthly: AnalyticsDataPoint[];
  currentActive: number;
  peakToday: number;
}

export interface RegistrationAnalytics {
  daily: AnalyticsDataPoint[];
  weekly: AnalyticsDataPoint[];
  total: number;
  thisWeek: number;
  thisMonth: number;
}

export interface LocationActivity {
  id: string;
  userId: string;
  username: string;
  lat: number;
  lng: number;
  updatedAt: string;
}

// ─── Announcement ─────────────────────────────
export interface Announcement {
  id: string;
  title: string;
  content: string;
  status: 'draft' | 'published' | 'scheduled';
  priority: 'low' | 'normal' | 'high' | 'critical';
  scheduledAt: string | null;
  publishedAt: string | null;
  createdBy: { id: string; username: string };
  createdAt: string;
  _count?: { notifications: number };
}

export interface CreateAnnouncementInput {
  title: string;
  content: string;
  status?: 'draft' | 'published' | 'scheduled';
  priority?: 'low' | 'normal' | 'high' | 'critical';
  scheduledAt?: string | null;
  targetUserIds?: string[];
}

// ─── Audit Log ────────────────────────────────
export interface AuditLog {
  id: string;
  action: string;
  entity: string;
  entityId: string;
  description: string;
  performedBy: { id: string; username: string } | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

// ─── System Settings ──────────────────────────
export interface SystemSettings {
  maintenanceMode: boolean;
  allowNewRegistrations: boolean;
  requireEmailVerification: boolean;
  maxUploadSize: number;
  defaultUserRole: string;
  sessionTimeout: number;
  nearbyRadius: number;
}

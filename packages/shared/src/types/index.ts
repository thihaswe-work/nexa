// ── User Types ──
export type UserRole = 'user' | 'moderator' | 'admin';
export type UserStatus = 'active' | 'inactive' | 'suspended' | 'banned';

// ── Location Types ──
export interface GeoPoint {
  latitude: number;
  longitude: number;
}

export interface GeoBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

export type DistanceUnit = 'km' | 'mi';

// ── Place Types ──
export type PlaceCategory = 'restaurant' | 'cafe' | 'bar' | 'park' | 'museum' | 'shopping' | 'entertainment' | 'other';

export type PlaceStatus = 'pending' | 'approved' | 'rejected' | 'closed';

// ── Social Types ──
export type InteractionType = 'check_in' | 'like' | 'review' | 'share';
export type NotificationType = 'friend_request' | 'check_in' | 'mention' | 'message' | 'system';

// ── API Types ──
export type SortOrder = 'asc' | 'desc';
export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
};

// ── Generic Types ──
export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type AsyncReturnType<T> = T extends Promise<infer U> ? U : T;
export type DeepPartial<T> = { [P in keyof T]?: DeepPartial<T[P]> };

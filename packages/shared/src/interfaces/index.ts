import type { GeoPoint, UserRole, UserStatus, PlaceCategory, PlaceStatus, PaginationMeta, SortOrder } from '../types';

// ── API Contracts ──
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  errors?: ApiError[];
  meta?: PaginationMeta;
}

export interface ApiError {
  field?: string;
  message: string;
  code: string;
}

// ── Pagination ──
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: SortOrder;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// ── User ──
export interface IUser {
  id: string;
  username: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  bio?: string;
  role: UserRole;
  status: UserStatus;
  lastLocation?: GeoPoint;
  isOnline: boolean;
  createdAt: string;
  updatedAt: string;
}

// ── Place ──
export interface IPlace {
  id: string;
  name: string;
  description?: string;
  category: PlaceCategory;
  location: GeoPoint;
  address: string;
  city: string;
  country: string;
  photos: string[];
  rating: number;
  reviewCount: number;
  status: PlaceStatus;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// ── Check-in ──
export interface ICheckIn {
  id: string;
  userId: string;
  placeId?: string;
  location: GeoPoint;
  note?: string;
  isPublic: boolean;
  createdAt: string;
}

// ── Friend ──
export interface IFriend {
  id: string;
  userId: string;
  friendId: string;
  status: 'pending' | 'accepted' | 'blocked';
  createdAt: string;
  updatedAt: string;
}

// ── Notification ──
export interface INotification {
  id: string;
  userId: string;
  type: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  isRead: boolean;
  createdAt: string;
}

// ── Auth ──
export interface IAuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export interface ILoginRequest {
  email: string;
  password: string;
}

export interface IRegisterRequest {
  username: string;
  email: string;
  password: string;
  displayName: string;
}

export interface IAuthUser {
  user: IUser;
  tokens: IAuthTokens;
}

// ── API ──
export const API_PREFIX = '/api/v1';
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

// ── Location ──
export const EARTH_RADIUS_KM = 6371;
export const MAX_SEARCH_RADIUS_KM = 50;
export const MIN_SEARCH_RADIUS_KM = 0.1;
export const DEFAULT_SEARCH_RADIUS_KM = 10;

// ── Auth ──
export const BCRYPT_SALT_ROUNDS = 12;
export const JWT_ACCESS_EXPIRY = '15m';
export const JWT_REFRESH_EXPIRY = '7d';
export const MAX_LOGIN_ATTEMPTS = 5;
export const LOGIN_LOCKOUT_DURATION_MIN = 15;

// ── Validation ──
export const USERNAME_MIN_LENGTH = 3;
export const USERNAME_MAX_LENGTH = 30;
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;
export const DISPLAY_NAME_MIN_LENGTH = 2;
export const DISPLAY_NAME_MAX_LENGTH = 50;
export const BIO_MAX_LENGTH = 500;

// ── File Uploads ──
export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const ALLOWED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];

// ── Rate Limiting ──
export const RATE_LIMIT_TTL = 60;
export const RATE_LIMIT_MAX = 100;

// ── Cache ──
export const CACHE_TTL_SHORT = 60; // 1 min
export const CACHE_TTL_MEDIUM = 300; // 5 min
export const CACHE_TTL_LONG = 3600; // 1 hour

// ── WebSocket ──
export const WS_EVENTS = {
  LOCATION_UPDATE: 'location:update',
  CHECK_IN: 'check_in:new',
  NOTIFICATION: 'notification:new',
  FRIEND_ONLINE: 'friend:online',
  FRIEND_OFFLINE: 'friend:offline',
} as const;

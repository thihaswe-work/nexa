## Objective
Build a location-based social app (Nexa) monorepo with Flutter mobile, NestJS API, Next.js admin — implementing auth, profiles, and nearby discovery.

## Important Details
- Monorepo: npm workspaces + TurboRepo at `C:\Users\fresh\Desktop\nexa`
- Database: PostgreSQL 16 + PostGIS 3.4, managed via Prisma ORM
- Backend: NestJS with global JwtAuthGuard + RolesGuard; @Public() skips auth
- Env: `DATABASE_URL=postgresql://postgres:password@localhost:5432/nexa_dev?schema=public`
  - `REDIS_URL=redis://localhost:6379` (ioredis 5.11)
- Auth: Argon2 hashing, JWT access (15m) + refresh token rotation (SHA-256 in DB)
- Soft delete: Prisma middleware auto-filters `deletedAt IS NULL` on all 20 models
- Privacy: `PrivacySettings` (showLocation, showOnline, etc.), Profile.isNearbyVisible
- Coordinates stored as `lat`/`lng` Floats + PostGIS geometry column synced via DB trigger
- `PostgisService` wraps raw spatial queries; `find_nearby_users()` DB function exists

## Redis Infrastructure (`apps/api/src/infrastructure/redis/`)
All services are exported from `RedisModule` (global).

| Service | File | Purpose | Key Namespace |
|---------|------|---------|--------------|
| `RedisService` | `redis.service.ts` | Core low-level operations: string, hash, set, sorted-set, pub/sub, pipeline, Lua eval | configurable prefix (default `nexa:`) |
| `PresenceService` | `presence.service.ts` | Online tracking with heartbeat/TTL, auto-away, status management | `presence:online:*`, `presence:status:*`, `presence:online-set` |
| `LocationCacheService` | `location-cache.service.ts` | Ephemeral location caching with Redis GEO for fast spatial lookups | `location:current:*`, `location:geo` |
| `SessionService` | `session.service.ts` | Refresh token session cache, JWT blacklist, token family theft detection | `sessions:*:*`, `blacklist:jwt:*`, `token-family:*` |
| `RateLimitService` | `rate-limit.service.ts` | Sliding-window rate limiter via sorted sets (Lua script + fallback) | `ratelimit:*:*` |
| `RedisPubSubService` | `redis-pubsub.service.ts` | Typed pub/sub for real-time events (presence, location, notifications) | dynamic channels |

Config additions: `RATE_LIMIT_LOGIN_*`, `RATE_LIMIT_API_*`, `PRESENCE_*`, `LOCATION_CACHE_TTL`

## Integration Points
- **Auth** (`auth.service.ts`): Login → `PresenceService.setOnline()` + pub/sub presence change; Logout → `setOffline()` + pub/sub
- **Tokens** (`tokens.service.ts`): `SessionService.createSession()` on generate; `revokeSession()` on refresh; `isTokenReused()` for theft detection; `revokeAllUserSessions()` on revoke-all
- **Nearby** (`nearby.service.ts`): `LocationCacheService.setLocation()` on update; cache-first `getLocation()`; `countNearby()` on update; `removeLocation()` on clear

## Work State
### Completed
- Monorepo root: git, docker-compose (PostGIS+Redis+MailHog), TurboRepo, shared packages
- API foundation: config (Joi), Prisma, Redis, global filters/interceptors/pipes, Swagger, health
- Database: 20 models (User→LocationHistory), indexes, PostGIS functions, triggers, views, soft-delete middleware
- Auth: register, login, logout, refresh rotation, email verify, forgot/reset password, 21 unit tests
- Users/Profile: CRUD, avatar upload, interests M:M, privacy settings, nearby-visibility toggle, 18 tests
- Interests: 24 seeded interests across 12 categories
- Nearby: location save/update/search/clear, radius filtering (100/500/1k/5km), coordinate obfuscation, privacy-aware, 8 tests
- **Redis**: Full reusable infrastructure layer with 6 services, integrated into Auth + Nearby, 19 new tests (Presence:5, Session:6, RateLimit:4, Nearby:8)

### Active
- (none)

### Blocked
- (none)

## Next Move
- Build out Admin UI with Next.js
- Add WebSocket gateway (`@nestjs/websockets` + `socket.io`) consuming `RedisPubSubService`
- Implement real-time notifications using pub/sub channels

## Relevant Files
- `apps/api/prisma/schema.prisma`: 20 models, all relationships
- `apps/api/src/database/postgis.service.ts`: findNearbyUsers(), calculateDistance(), updateUserLocation()
- `apps/api/src/modules/users/users.service.ts`: profile with privacySettings + isNearbyVisible
- `apps/api/src/modules/auth/guards/jwt-auth.guard.ts`: global JWT guard
- `apps/api/src/app.module.ts`: all module wiring + global guards
- `apps/api/src/infrastructure/redis/redis.service.ts`: Core Redis client with all data structure operations

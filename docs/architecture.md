# Nexa Architecture

## Overview

Nexa is a location-based social application built as a monorepo containing three primary applications and shared packages.

## System Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Mobile App                        │
│                  (Flutter / Dart)                    │
└──────────────────┬──────────────────────────────────┘
                   │ HTTP/WebSocket
                   ▼
┌─────────────────────────────────────────────────────┐
│                  API Gateway                         │
│               (NestJS / TypeScript)                  │
├──────────────────┬──────────────────────────────────┤
│   Auth Module    │    Location Module                │
│   User Module    │    Place Module                   │
│   Social Module  │    ...                            │
├──────────────────┴──────────────────────────────────┤
│                 Service Layer                        │
├──────────────────┬──────────────────────────────────┤
│   PostgreSQL     │    Redis Cache                    │
│   (PostGIS)      │    (Geo-indexing)                 │
└──────────────────┴──────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────┐
│              Admin Dashboard                         │
│            (Next.js / TypeScript)                    │
└─────────────────────────────────────────────────────┘
```

## Clean Architecture per Module

Each module in the API follows clean architecture principles:

### Layer Structure

```
module/
├── domain/                  ← Innermost layer (no dependencies)
│   ├── entities/            Business objects
│   ├── repositories/        Interface definitions
│   └── events/              Domain events
├── application/             ← Use case orchestration
│   ├── commands/            CQRS commands
│   ├── queries/             CQRS queries
│   └── services/            Application services
├── infrastructure/          ← External concerns
│   ├── persistence/         DB implementations
│   └── strategies/          Auth strategies
└── presentation/            ← HTTP layer
    ├── controllers/         Route handlers
    └── dto/                 Request/response schemas
```

### Dependency Rule

- Domain → (nothing)
- Application → Domain
- Infrastructure → Domain + Application
- Presentation → Application + Domain

## Shared Package (`@nexa/shared`)

Located in `packages/shared/`, this package contains code shared between API and Admin:

- **Types** — UserRole, GeoPoint, PaginationMeta, etc.
- **Interfaces** — IUser, IPlace, ICheckIn, API contracts
- **Constants** — Validation rules, API config, WS events
- **Utils** — Geo distance, bounds calculation, slugify

## Database

PostgreSQL with PostGIS extension for spatial queries.

### Key Entities
- `users` — User accounts with location tracking
- `places` — Points of interest with geo-coordinates
- `check_ins` — User check-in records
- `friends` — Social graph relationships
- `notifications` — Push notification history

## API Design

### RESTful API
- Prefix: `/api/v1`
- Versioning: URI-based (`/api/v1/auth/login`)
- Auth: JWT Bearer tokens
- Rate limiting: Configurable per endpoint
- Response format: Standardized envelope

### WebSocket
- Socket.IO for real-time features
- Location updates, notifications, online status

## Security

- Helmet.js for HTTP headers
- JWT with refresh token rotation
- bcrypt password hashing (12 rounds)
- Rate limiting via @nestjs/throttler
- Input validation with class-validator
- CORS restricted to known origins

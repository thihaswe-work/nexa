# Nexa

Location-based social application — connect with people around you.

## Architecture

This is a **monorepo** managed with **npm workspaces** and **TurboRepo**.

```
nexa/
├── apps/
│   ├── api/         # NestJS backend API
│   ├── admin/       # Next.js admin dashboard
│   └── mobile/      # Flutter mobile app
├── packages/
│   ├── shared/      # Shared types, interfaces, constants, utils
│   ├── eslint-config/ # Shared ESLint configuration
│   └── tsconfig/    # Shared TypeScript configurations
├── docs/            # Architecture & development documentation
├── tools/           # Build & development scripts
└── .github/         # CI/CD workflows
```

## Tech Stack

| Layer      | Technology                                 |
| ---------- | ------------------------------------------ |
| Mobile     | Flutter + Dart                             |
| Backend    | NestJS + TypeScript + PostgreSQL (PostGIS) |
| Admin      | Next.js 14 + TypeScript + Tailwind CSS     |
| Cache      | Redis                                      |
| Monorepo   | npm workspaces + TurboRepo                 |
| Containers | Docker + Docker Compose                    |
| CI/CD      | GitHub Actions                             |

## Prerequisites

- Node.js >= 20
- Flutter >= 3.16
- Docker & Docker Compose
- npm >= 10

## Quick Start

### Backend + Admin (Docker — recommended)

```bash
# 1. Clone and install dependencies
git clone https://github.com/your-org/nexa.git
cd nexa
npm install

# 2. Start everything (API + Admin + PostgreSQL + Redis)
npm run docker:dev
```

The API is at `http://localhost:4000/api/v1` and Admin at `http://localhost:3000`.

> The dev Docker setup uses hot-reload — changes to `apps/api/src/` or `apps/admin/src/` are reflected immediately.

### Backend + Admin (Native — without Docker)

```bash
# 1. Install and start infrastructure
npm install
npm run docker:dev       # starts only PostgreSQL + Redis containers

# 2. Copy environment files
cp .env.example .env
cp apps/api/.env.example apps/api/.env
cp apps/admin/.env.example apps/admin/.env

# 3. Run database migrations
cd apps/api
npx prisma migrate deploy
npx prisma generate
cd ..

# 4. Start each app in a separate terminal
npm run api:dev     # Terminal 1 — API on port 4000
npm run admin:dev   # Terminal 2 — Admin on port 3000
```

### Mobile App (Flutter)

```bash
# 1. Make sure the API is running (Docker or native)

# 2. Install Flutter dependencies
cd apps/mobile
flutter pub get

# 3. Generate JSON serialization code
dart run build_runner build --delete-conflicting-outputs

# 4. Run on device/emulator
flutter run
```

> **Note**: The mobile app expects the API at `http://localhost:4000/api/v1` by default.
> To change this, set the `API_BASE_URL` compile-time variable:
>
> ```bash
> flutter run --dart-define=API_BASE_URL=https://your-api.com/api/v1
> ```

## Project Structure

### Mobile App (`apps/mobile/`)

```
lib/
├── core/               # Shared infrastructure & utilities
│   ├── config/         # App configuration
│   ├── constants/      # App & API constants
│   ├── errors/         # Exception & failure classes
│   ├── network/        # HTTP client, auth interceptors
│   ├── router/         # GoRouter setup & redirects
│   ├── services/       # Location service
│   ├── socket/         # WebSocket client
│   ├── storage/        # Secure token storage
│   ├── theme/          # Colors, text styles, theme
│   └── utils/          # Type definitions
├── modules/            # Feature modules (clean architecture)
│   ├── auth/           # Login, register, session
│   ├── chat/           # Conversations, messages, reactions
│   ├── nearby/         # Location-based user discovery
│   ├── notification/   # Push & in-app notifications
│   ├── settings/       # App settings & privacy
│   └── user/           # Profile, interests
└── shared/             # Reusable widgets (avatar, skeleton, etc.)
```

### Backend API (`apps/api/`)

```
src/
├── core/               # Cross-cutting concerns
│   ├── config/         # Environment config loader
│   ├── database/       # Migrations & seeds
│   ├── decorators/     # Custom decorators
│   ├── filters/        # Exception filters
│   ├── guards/         # Auth & role guards
│   ├── interceptors/   # Request/response interceptors
│   └── pipes/          # Validation pipes
└── modules/            # Feature modules
    ├── auth/           # Authentication & authorization
    ├── users/          # User management
    ├── locations/      # Geo-location services
    ├── places/         # Place management
    └── social/         # Social features
```

### Admin Dashboard (`apps/admin/`)

```
src/
├── app/                # Next.js App Router pages
│   ├── (auth)/         # Login, register
│   └── dashboard/      # Dashboard pages
├── components/
│   ├── ui/             # Reusable UI primitives
│   ├── features/       # Feature-specific components
│   └── layout/         # Layout components
├── lib/
│   ├── api/            # API client & query hooks
│   ├── hooks/          # Custom React hooks
│   ├── store/          # Zustand stores
│   └── utils/          # Utilities
├── styles/             # Global styles
└── types/              # TypeScript types
```

## Available Scripts

| Command                               | Description                                 |
| ------------------------------------- | ------------------------------------------- |
| `npm run dev`                         | Start all apps in development mode (native) |
| `npm run build`                       | Build all apps for production               |
| `npm run lint`                        | Lint all packages                           |
| `npm run test`                        | Run all tests                               |
| `npm run api:dev`                     | Start API only (native)                     |
| `npm run admin:dev`                   | Start admin only (native)                   |
| `npm run docker:dev`                  | Start full dev stack (API + Admin + infra)  |
| `npm run docker:prod`                 | Start production stack                      |
| `cd apps/mobile && flutter run`       | Run mobile app                              |
| `cd apps/mobile && flutter build apk` | Build mobile APK                            |

## Environment Variables

Copy the example files and adjust:

- `.env` — Global variables
- `apps/api/.env` — API-specific variables
- `apps/admin/.env` — Admin-specific variables

## Docker

```bash
# Development — full stack with hot-reload (API + Admin + PostgreSQL + Redis)
npm run docker:dev

# Production — build and start all services
npm run docker:prod
```

## Clean Architecture Layers

Each feature module follows clean architecture:

1. **Domain** — Enterprise business rules (entities, repository interfaces, use cases)
2. **Application** — Application-specific business rules (services, commands, queries)
3. **Infrastructure** — External implementations (database, APIs, file system)
4. **Presentation** — UI layer (controllers, pages, components)

Dependencies point **inward**: Presentation → Application → Domain.

## Project Conventions

### Naming

| Type              | Convention               | Example           |
| ----------------- | ------------------------ | ----------------- |
| Files             | kebab-case               | `user.service.ts` |
| Classes           | PascalCase               | `UserService`     |
| Functions/Methods | camelCase                | `getUserById()`   |
| Variables         | camelCase                | `userName`        |
| Constants         | UPPER_SNAKE              | `MAX_FILE_SIZE`   |
| Types/Interfaces  | PascalCase with I prefix | `IUser`           |
| DTOs              | PascalCase               | `CreateUserDto`   |

### Git Workflow

1. Branch from `develop`
2. Use feature branches: `feat/description`, `fix/description`
3. PR to `develop` for review
4. Merge to `main` for releases

### Commit Messages

Follow conventional commits: `type(scope): description`

- `feat(api): add user location endpoint`
- `fix(admin): resolve pagination issue`
- `chore(deps): upgrade nestjs to v10`

## Testing

### API (Jest)

```bash
cd apps/api
npm run test        # Unit tests
npm run test:e2e    # E2E tests
npm run test:cov    # Coverage report
```

### Admin (Jest + Testing Library)

```bash
cd apps/admin
npm run test
```

### Mobile (Flutter)

```bash
cd apps/mobile
flutter test          # Run tests
flutter analyze       # Static analysis
dart run build_runner build  # Regenerate .g.dart files
```

## Environment Variables

| Variable          | Description                  | Default                                          |
| ----------------- | ---------------------------- | ------------------------------------------------ |
| `DATABASE_URL`    | PostgreSQL connection string | `postgresql://nexa:nexa@localhost:5432/nexa_dev` |
| `JWT_SECRET`      | JWT signing secret           | (must set)                                       |
| `NEXTAUTH_SECRET` | NextAuth encryption key      | (must set for admin)                             |

### Mobile App (Dart-define)

The mobile app uses compile-time constants passed via `--dart-define`:

```bash
flutter run --dart-define=API_BASE_URL=https://api.nexa.app/api/v1
```

| Variable       | Description          | Default                        |
| -------------- | -------------------- | ------------------------------ |
| `API_BASE_URL` | Backend API base URL | `http://localhost:4000/api/v1` |
| `WS_URL`       | WebSocket server URL | `http://localhost:4000`        |

### Adding New Variables

1. Add to `.env.example` with sensible default
2. Add to `apps/api/src/config/validation.schema.ts`
3. Add Dart `--dart-define` entries in `apps/mobile/lib/core/config/app_config.dart`
4. Document in README

## Troubleshooting

### Port Conflicts

Default ports:

- API: 4000
- Admin: 3000
- PostgreSQL: 5432
- Redis: 6379
- MailHog: 1025 / 8025

Override via environment variables.

### Database Reset

```bash
docker compose -f docker-compose.dev.yml down -v
npm run docker:dev
cd apps/api && npx prisma migrate deploy && npx prisma generate
```

## License

MIT

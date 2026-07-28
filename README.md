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

| Layer        | Technology                                      |
| ------------ | ----------------------------------------------- |
| Mobile       | Flutter + Dart                                  |
| Backend      | NestJS + TypeScript + PostgreSQL (PostGIS)      |
| Admin        | Next.js 14 + TypeScript + Tailwind CSS          |
| Cache        | Redis                                           |
| Monorepo     | npm workspaces + TurboRepo                      |
| Containers   | Docker + Docker Compose                         |
| CI/CD        | GitHub Actions                                  |

## Prerequisites

- Node.js >= 20
- Flutter >= 3.16
- Docker & Docker Compose
- npm >= 10

## Quick Start

```bash
# 1. Clone and install
git clone https://github.com/your-org/nexa.git
cd nexa
npm install

# 2. Start infrastructure (PostgreSQL + Redis)
npm run docker:dev

# 3. Copy environment files
cp .env.example .env
cp apps/api/.env.example apps/api/.env
cp apps/admin/.env.example apps/admin/.env

# 4. Run database migrations
npm run api:dev -- npm run migration:run

# 5. Start development
npm run dev
```

## Project Structure

### Mobile App (`apps/mobile/`)

```
lib/
├── core/               # Shared infrastructure
│   ├── constants/      # App & API constants
│   ├── errors/         # Exception & failure classes
│   ├── network/        # HTTP client, interceptors
│   ├── theme/          # Colors, text styles, theme
│   └── utils/          # General utilities
└── features/           # Feature modules
    ├── auth/           # Authentication
    │   ├── data/       # Data sources, models, repo impl
    │   ├── domain/     # Entities, repo interfaces, use cases
    │   └── presentation/ # Pages, providers, widgets
    ├── location/       # Location services
    ├── social/         # Social interactions
    └── profile/        # User profile
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

| Command              | Description                         |
| -------------------- | ----------------------------------- |
| `npm run dev`        | Start all apps in development mode  |
| `npm run build`      | Build all apps for production       |
| `npm run lint`       | Lint all packages                   |
| `npm run test`       | Run all tests                       |
| `npm run api:dev`    | Start API only                      |
| `npm run admin:dev`  | Start admin only                    |
| `npm run docker:dev` | Start infrastructure containers     |

## Environment Variables

Copy the example files and adjust:

- `.env` — Global variables
- `apps/api/.env` — API-specific variables
- `apps/admin/.env` — Admin-specific variables

## Docker

```bash
# Development (infrastructure only)
npm run docker:dev

# Full production stack
docker compose up --build
```

## Clean Architecture Layers

Each feature module follows clean architecture:

1. **Domain** — Enterprise business rules (entities, repository interfaces, use cases)
2. **Application** — Application-specific business rules (services, commands, queries)
3. **Infrastructure** — External implementations (database, APIs, file system)
4. **Presentation** — UI layer (controllers, pages, components)

Dependencies point **inward**: Presentation → Application → Domain.

## License

MIT

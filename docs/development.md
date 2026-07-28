# Development Guide

## Getting Started

### Prerequisites

```bash
node --version  # >= 20
npm --version   # >= 10
flutter --version  # >= 3.16
docker --version  # >= 24
```

### First Time Setup

```bash
# 1. Clone repository
git clone <repo-url>
cd nexa

# 2. Install all dependencies
npm install

# 3. Start dev infrastructure
npm run docker:dev

# 4. Copy environment files
cp .env.example .env
cp apps/api/.env.example apps/api/.env
cp apps/admin/.env.example apps/admin/.env

# 5. Run database migrations
cd apps/api
npx typeorm migration:run
cd ../..

# 6. Start development servers
npm run dev
```

## Development Workflow

### Running Individual Apps

```bash
# API only
npm run api:dev

# Admin only
npm run admin:dev

# Mobile (requires Flutter SDK)
cd apps/mobile
flutter run
```

### Code Quality

```bash
# Lint all packages
npm run lint

# Run all tests
npm run test

# Format code
npm run format
```

### Database

```bash
# Generate migration
cd apps/api
npx typeorm migration:generate src/core/database/migrations/MigrationName

# Run migrations
npx typeorm migration:run

# Revert last migration
npx typeorm migration:revert

# Seed database
npm run seed
```

## Project Conventions

### Naming

| Type | Convention | Example |
|------|-----------|---------|
| Files | kebab-case | `user.service.ts` |
| Classes | PascalCase | `UserService` |
| Functions/Methods | camelCase | `getUserById()` |
| Variables | camelCase | `userName` |
| Constants | UPPER_SNAKE | `MAX_FILE_SIZE` |
| Types/Interfaces | PascalCase with I prefix | `IUser` |
| DTOs | PascalCase | `CreateUserDto` |

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

### Mobile (Flutter Test)

```bash
cd apps/mobile
flutter test
```

## Docker

### Development

```bash
# Infrastructure only (PostgreSQL + Redis)
npm run docker:dev

# Full stack with hot reload
docker compose -f docker-compose.dev.yml up
```

### Production

```bash
# Build and start all services
docker compose up --build

# Or build individually
docker compose build api
docker compose build admin
```

## Environment Variables

### Required Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://nexa:nexa@localhost:5432/nexa_dev` |
| `JWT_SECRET` | JWT signing secret | (must set) |
| `NEXTAUTH_SECRET` | NextAuth encryption key | (must set for admin) |

### Adding New Variables

1. Add to `.env.example` with sensible default
2. Add to `apps/api/src/core/config/configuration.ts`
3. Document in README

## Troubleshooting

### Port Conflicts

Default ports:
- API: 4000
- Admin: 3000
- PostgreSQL: 5432
- Redis: 6379
- MailHog: 1025/8025

Override via environment variables.

### Database Reset

```bash
docker compose down -v
npm run docker:dev
cd apps/api && npx typeorm migration:run

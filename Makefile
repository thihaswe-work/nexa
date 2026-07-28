# ──────────────────────────────────────────────
# Nexa - Makefile
# ──────────────────────────────────────────────

.DEFAULT_GOAL := help

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-25s\033[0m %s\n", $$1, $$2}'

# ── Development ──────────────────────────────

dev: ## Start all services in development mode
	docker compose -f docker-compose.dev.yml up -d
	cd apps/api && npm run dev &
	cd apps/admin && npm run dev &

dev-infra: ## Start infrastructure only (Postgres, Redis, MinIO)
	docker compose -f docker-compose.dev.yml up -d postgres redis minio mailhog

dev-logs: ## View development logs
	docker compose -f docker-compose.dev.yml logs -f

dev-stop: ## Stop development services
	docker compose -f docker-compose.dev.yml down

# ── Production ──────────────────────────────

prod: ## Start production services
	docker compose up -d

prod-build: ## Build production images
	docker compose build

prod-logs: ## View production logs
	docker compose logs -f

prod-stop: ## Stop production services
	docker compose down

prod-restart: ## Restart production services
	docker compose restart

prod-ps: ## List running production containers
	docker compose ps

# ── Database ────────────────────────────────

db-migrate: ## Run database migrations
	cd apps/api && npx prisma migrate deploy

db-migrate-dev: ## Run database migrations (development)
	cd apps/api && npx prisma migrate dev

db-generate: ## Generate Prisma client
	cd apps/api && npx prisma generate

db-seed: ## Seed the database
	cd apps/api && npx prisma db seed

db-studio: ## Open Prisma Studio
	cd apps/api && npx prisma studio

db-reset: ## Reset database (dev only)
	cd apps/api && npx prisma migrate reset --force

# ── Testing ─────────────────────────────────

test: ## Run all tests
	npm test

test-api: ## Run API tests
	cd apps/api && npm test

test-admin: ## Run Admin tests
	cd apps/admin && npm test

test-e2e: ## Run E2E tests
	cd apps/api && npm run test:e2e

test-coverage: ## Run tests with coverage
	npm test -- --coverage

# ── Building ────────────────────────────────

build: ## Build all applications
	npm run build

build-api: ## Build API
	cd apps/api && npm run build

build-admin: ## Build Admin
	cd apps/admin && npm run build

# ── Linting ─────────────────────────────────

lint: ## Run linters
	npm run lint

format: ## Format code
	npm run format

# ── Maintenance ─────────────────────────────

clean: ## Clean build artifacts
	npm run clean

docker-clean: ## Remove unused Docker resources
	docker system prune -f

backup: ## Backup database
	./scripts/backup/backup.sh

restore: ## Restore database (usage: make restore FILE=<backup_file>)
	./scripts/backup/restore.sh $(FILE)

# ── Deployment ──────────────────────────────

deploy: ## Deploy to production
	@echo "Pulling latest images..."
	docker compose pull
	@echo "Starting services..."
	docker compose up -d --remove-orphans
	@echo "Running migrations..."
	docker compose exec -T api npx prisma migrate deploy
	@echo "Deployment complete."

deploy-rollback: ## Rollback to previous version
	docker compose down
	docker compose up -d --remove-orphans

# ── Monitoring ──────────────────────────────

monitor-logs: ## View aggregated logs
	docker compose logs -f api admin

monitor-stats: ## View container resource usage
	docker stats

# ── CI ──────────────────────────────────────

ci: lint test build ## Run CI pipeline locally

.PHONY: help dev dev-infra dev-logs dev-stop prod prod-build prod-logs prod-stop \
	prod-restart prod-ps db-migrate db-migrate-dev db-generate db-seed db-studio \
	db-reset test test-api test-admin test-e2e test-coverage build build-api \
	build-admin lint format clean docker-clean backup restore deploy \
	deploy-rollback monitor-logs monitor-stats ci

#!/bin/bash
set -euo pipefail

# ──────────────────────────────────────────────
# Nexa Deployment Script
# ──────────────────────────────────────────────
# Usage: ./scripts/deploy/deploy.sh [environment]
#   environment: production | staging (default: production)

ENV="${1:-production}"
SCRIPT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"

echo "=== Nexa Deployment ==="
echo "Environment: $ENV"
echo "Timestamp: $(date -u '+%Y-%m-%dT%H:%M:%SZ')"

# ── Pre-deployment checks ───────────────────
echo ""
echo "--- Pre-deployment checks ---"

if ! command -v docker &> /dev/null; then
  echo "ERROR: Docker is not installed"
  exit 1
fi

if ! docker compose version &> /dev/null; then
  echo "ERROR: Docker Compose is not installed"
  exit 1
fi

if [ ! -f "$SCRIPT_DIR/.env" ]; then
  echo "ERROR: .env file not found at $SCRIPT_DIR/.env"
  echo "Copy .env.example to .env and configure"
  exit 1
fi

# Source environment
set -a
source "$SCRIPT_DIR/.env"
set +a

# ── Deployment ──────────────────────────────
echo ""
echo "--- Pulling latest images ---"
docker compose pull

echo ""
echo "--- Starting services ---"
docker compose up -d --remove-orphans

echo ""
echo "--- Waiting for services ---"
sleep 10

# ── Database migrations ─────────────────────
echo ""
echo "--- Running database migrations ---"
docker compose exec -T api npx prisma migrate deploy

# ── Health checks ───────────────────────────
echo ""
echo "--- Health checks ---"

check_health() {
  local service=$1
  local url=$2
  local max_retries=10
  local retry=0

  while [ $retry -lt $max_retries ]; do
    if curl -sf "$url" > /dev/null 2>&1; then
      echo "  ✓ $service is healthy"
      return 0
    fi
    echo "  Waiting for $service to be healthy... ($((retry + 1))/$max_retries)"
    sleep 3
    retry=$((retry + 1))
  done

  echo "  ✗ $service health check failed"
  return 1
}

check_health "API" "http://localhost:4000/health/live"
check_health "Admin" "http://localhost:3000"
check_health "PostgreSQL" "http://localhost:5432" 2>/dev/null || true

# ── Cleanup ─────────────────────────────────
echo ""
echo "--- Cleanup ---"
docker system prune -f --filter "until=24h" || true

echo ""
echo "=== Deployment complete ==="

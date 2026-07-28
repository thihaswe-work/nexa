#!/bin/bash
set -euo pipefail

# ──────────────────────────────────────────────
# Nexa Database Migration Script
# ──────────────────────────────────────────────
# Usage: ./scripts/db/migrate.sh [environment]
#   environment: production | staging | development (default: production)

ENV="${1:-production}"
SCRIPT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"

echo "=== Nexa Database Migration ==="
echo "Environment: $ENV"
echo "Timestamp: $(date -u '+%Y-%m-%dT%H:%M:%SZ')"

# Validate required environment variables
if [ -z "${DATABASE_URL:-}" ]; then
  echo "ERROR: DATABASE_URL is not set"
  exit 1
fi

# ── Pre-migration checks ────────────────────
echo ""
echo "--- Pre-migration checks ---"
echo "Database connectivity..."
npx prisma db execute --stdin <<< "SELECT 1;" 2>/dev/null || {
  echo "ERROR: Cannot connect to database"
  exit 1
}

# ── Apply migrations ────────────────────────
echo ""
echo "--- Applying migrations ---"

case "$ENV" in
  production|staging)
    echo "Running prisma migrate deploy..."
    npx prisma migrate deploy
    ;;
  development)
    echo "Running prisma migrate dev..."
    npx prisma migrate dev
    ;;
  *)
    echo "ERROR: Unknown environment: $ENV"
    echo "Usage: $0 [production|staging|development]"
    exit 1
    ;;
esac

# ── Generate Prisma client ──────────────────
echo ""
echo "--- Generating Prisma client ---"
npx prisma generate

# ── Post-migration verification ─────────────
echo ""
echo "--- Post-migration verification ---"
echo "Verifying schema..."
npx prisma validate || {
  echo "WARNING: Prisma schema validation failed"
}

echo ""
echo "=== Migration complete ==="

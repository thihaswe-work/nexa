#!/bin/bash
set -euo pipefail

# ──────────────────────────────────────────────
# Nexa Database Rollback Script
# ──────────────────────────────────────────────
# Usage: ./scripts/db/rollback.sh <migration_name>

MIGRATION_NAME="${1:?Usage: $0 <migration_name>}"

echo "=== Rolling back migration: $MIGRATION_NAME ==="
echo "Timestamp: $(date -u '+%Y-%m-%dT%H:%M:%SZ')"

if [ -z "${DATABASE_URL:-}" ]; then
  echo "ERROR: DATABASE_URL is not set"
  exit 1
fi

echo "Rolling back..."
npx prisma migrate diff \
  --from-migrations "$MIGRATION_NAME" \
  --to-schema-datamodel ./prisma/schema.prisma \
  --script \
  | npx prisma db execute --stdin

echo "=== Rollback complete ==="
echo "Migration '$MIGRATION_NAME' has been rolled back."
echo ""
echo "To re-apply, run: ./scripts/db/migrate.sh"

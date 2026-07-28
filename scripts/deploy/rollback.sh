#!/bin/bash
set -euo pipefail

# ──────────────────────────────────────────────
# Nexa Rollback Script
# ──────────────────────────────────────────────
# Usage: ./scripts/deploy/rollback.sh [version_tag]

VERSION="${1:-latest}"
SCRIPT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"

echo "=== Nexa Rollback ==="
echo "Target version: $VERSION"
echo "Timestamp: $(date -u '+%Y-%m-%dT%H:%M:%SZ')"

cd "$SCRIPT_DIR"

# ── Stop current services ──────────────────
echo ""
echo "--- Stopping current services ---"
docker compose down

# ── Revert to previous images ──────────────
echo ""
echo "--- Rolling back to $VERSION ---"
if [ "$VERSION" != "latest" ]; then
  # Tag the previous version
  docker tag ghcr.io/nexa/app/api:"$VERSION" ghcr.io/nexa/app/api:latest
  docker tag ghcr.io/nexa/app/admin:"$VERSION" ghcr.io/nexa/app/admin:latest
fi

# ── Restart with previous version ──────────
echo ""
echo "--- Starting services ---"
docker compose up -d --remove-orphans

# ── Rollback database if needed ────────────
if [ -n "${ROLLBACK_MIGRATION:-}" ]; then
  echo ""
  echo "--- Rolling back database migration ---"
  docker compose exec -T api npx prisma migrate resolve --rolled-back "$ROLLBACK_MIGRATION"
fi

echo ""
echo "=== Rollback complete ==="

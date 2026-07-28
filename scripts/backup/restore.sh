#!/bin/bash
set -euo pipefail

# ──────────────────────────────────────────────
# Nexa Database Restore Script
# ──────────────────────────────────────────────
# Usage: ./scripts/backup/restore.sh <backup_file> [database_url]

BACKUP_FILE="${1:?Usage: $0 <backup_file> [database_url]}"
DATABASE_URL="${2:-${DATABASE_URL:?DATABASE_URL must be set}}"

echo "=== Nexa Database Restore ==="
echo "Backup file: $BACKUP_FILE"
echo "Timestamp: $(date -u '+%Y-%m-%dT%H:%M:%SZ')"

if [ ! -f "$BACKUP_FILE" ]; then
  echo "ERROR: Backup file not found: $BACKUP_FILE"
  exit 1
fi

# ── Decrypt if encrypted ────────────────────
RESTORE_FILE="$BACKUP_FILE"
if [[ "$BACKUP_FILE" == *.gpg ]]; then
  echo "Decrypting..."
  RESTORE_FILE="${BACKUP_FILE%.gpg}"
  gpg --batch --yes --decrypt \
    --output "$RESTORE_FILE" \
    "$BACKUP_FILE"
fi

# ── Decompress if compressed ────────────────
if [[ "$RESTORE_FILE" == *.gz ]]; then
  echo "Decompressing..."
  gunzip -f "$RESTORE_FILE"
  RESTORE_FILE="${RESTORE_FILE%.gz}"
fi

# ── Confirm ─────────────────────────────────
echo ""
echo "WARNING: This will OVERWRITE the database at:"
echo "  $DATABASE_URL"
echo ""
read -p "Are you sure? Type 'yes' to continue: " CONFIRM
if [ "$CONFIRM" != "yes" ]; then
  echo "Restore cancelled."
  exit 1
fi

# ── Restore ─────────────────────────────────
echo ""
echo "--- Restoring from backup ---"
pg_restore \
  --dbname="$DATABASE_URL" \
  --clean \
  --if-exists \
  --verbose \
  --no-owner \
  --no-acl \
  "$RESTORE_FILE" \
  2>&1

echo ""
echo "=== Restore complete ==="

#!/bin/bash
set -euo pipefail

# ──────────────────────────────────────────────
# Nexa Database Backup Script
# ──────────────────────────────────────────────
# Creates encrypted, compressed PostgreSQL backups
# Usage: ./scripts/backup/backup.sh [database_url] [backup_dir]

BACKUP_DIR="${2:-./backups}"
TIMESTAMP=$(date -u '+%Y%m%d_%H%M%S')
BACKUP_FILE="${BACKUP_DIR}/nexa_db_${TIMESTAMP}.dump.gz"
ENCRYPTED_FILE="${BACKUP_FILE}.gpg"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-30}"

DATABASE_URL="${1:-${DATABASE_URL:?DATABASE_URL must be set}}"

echo "=== Nexa Database Backup ==="
echo "Backup directory: $BACKUP_DIR"
echo "Timestamp: $TIMESTAMP"
echo "Retention: $RETENTION_DAYS days"

mkdir -p "$BACKUP_DIR"

# ── Perform backup ──────────────────────────
echo ""
echo "--- Creating backup ---"
pg_dump \
  --dbname="$DATABASE_URL" \
  --format=custom \
  --compress=9 \
  --verbose \
  --file="${BACKUP_FILE%.gz}" \
  --exclude-table-data='*.sessions' \
  --exclude-table-data='*.logs' \
  2>&1

# Compress
echo "Compressing..."
gzip -9 "${BACKUP_FILE%.gz}"

# Encrypt (if GPG key is configured)
if [ -n "${GPG_RECIPIENT:-}" ]; then
  echo "Encrypting..."
  gpg --batch --yes --encrypt \
    --recipient "$GPG_RECIPIENT" \
    --output "$ENCRYPTED_FILE" \
    "$BACKUP_FILE"
  rm -f "$BACKUP_FILE"
  BACKUP_FILE="$ENCRYPTED_FILE"
fi

BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
echo "Backup created: $BACKUP_FILE ($BACKUP_SIZE)"

# ── Cleanup old backups ─────────────────────
echo ""
echo "--- Cleaning up old backups ---"
find "$BACKUP_DIR" -name "nexa_db_*.dump.gz" -mtime "+$RETENTION_DAYS" -delete
find "$BACKUP_DIR" -name "nexa_db_*.dump.gz.gpg" -mtime "+$RETENTION_DAYS" -delete

echo ""
echo "=== Backup complete ==="
echo "File: $BACKUP_FILE"
echo "Size: $BACKUP_SIZE"

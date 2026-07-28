#!/bin/bash
set -euo pipefail

echo "========================================"
echo "  Nexa Database Setup"
echo "========================================"

# Configuration
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_USER="${DB_USER:-postgres}"
DB_PASSWORD="${DB_PASSWORD:-password}"
DB_NAME="${DB_NAME:-nexa_dev}"

export PGPASSWORD="$DB_PASSWORD"

echo ""
echo "1. Creating database if it doesn't exist..."
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -tc \
  "SELECT 1 FROM pg_database WHERE datname = '$DB_NAME'" | grep -q 1 \
  || psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -c "CREATE DATABASE $DB_NAME;"

echo "2. Installing PostGIS extension..."
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "CREATE EXTENSION IF NOT EXISTS postgis;"
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";"

echo "3. Running Prisma migrations..."
cd "$(dirname "$0")/.."
npx prisma generate
npx prisma migrate dev --name init

echo "4. Seeding database..."
npx ts-node prisma/seed.ts

echo ""
echo "========================================"
echo "  Database setup complete!"
echo "  Host:     $DB_HOST:$DB_PORT"
echo "  Database: $DB_NAME"
echo "  User:     $DB_USER"
echo "========================================"

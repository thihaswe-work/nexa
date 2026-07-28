-- ──────────────────────────────────────────────
-- Nexa Database: Initial Migration
-- PostgreSQL + PostGIS
-- ──────────────────────────────────────────────

-- 1. Enable PostGIS extension (must be first)
CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA public;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;

-- 2. Enums (created by Prisma automatically, listed here for reference)
-- Prisma handles enum creation via migration. This file is a template.
-- After running `prisma migrate dev --create-only`, replace the generated
-- migration.sql with this file's content (keeping Prisma-generated enums).

-- ──────────────────────────────────────────────
-- 3. PostGIS Helper Functions
-- ──────────────────────────────────────────────

-- Update profile location trigger
CREATE OR REPLACE FUNCTION sync_profile_location()
RETURNS trigger AS $$
BEGIN
  IF NEW.lat IS NOT NULL AND NEW.lng IS NOT NULL THEN
    NEW.location = ST_SetSRID(ST_MakePoint(NEW.lng, NEW.lat), 4326);
  ELSIF NEW.lat IS NULL OR NEW.lng IS NULL THEN
    NEW.location = NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION sync_profile_location_from_geom()
RETURNS trigger AS $$
BEGIN
  IF NEW.location IS NOT NULL THEN
    NEW.lat := ST_Y(NEW.location::geometry);
    NEW.lng := ST_X(NEW.location::geometry);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update location_history location trigger
CREATE OR REPLACE FUNCTION sync_location_history_location()
RETURNS trigger AS $$
BEGIN
  IF NEW.lat IS NOT NULL AND NEW.lng IS NOT NULL THEN
    NEW.location = ST_SetSRID(ST_MakePoint(NEW.lng, NEW.lat), 4326);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ──────────────────────────────────────────────
-- 4. Triggers
-- ──────────────────────────────────────────────

-- Auto-sync profile lat/lng ↔ geometry
DROP TRIGGER IF EXISTS trg_sync_profile_location ON profiles;
CREATE TRIGGER trg_sync_profile_location
  BEFORE INSERT OR UPDATE OF lat, lng
  ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION sync_profile_location();

-- Auto-sync location_history lat/lng ↔ geometry
DROP TRIGGER IF EXISTS trg_sync_location_history_location ON location_history;
CREATE TRIGGER trg_sync_location_history_location
  BEFORE INSERT OR UPDATE OF lat, lng
  ON location_history
  FOR EACH ROW
  EXECUTE FUNCTION sync_location_history_location();

-- ──────────────────────────────────────────────
-- 5. PostGIS Indexes
-- ──────────────────────────────────────────────

-- Spatial indexes for location-based queries
CREATE INDEX IF NOT EXISTS idx_profiles_location_gist
  ON profiles USING GIST (location);

CREATE INDEX IF NOT EXISTS idx_location_history_location_gist
  ON location_history USING GIST (location);

CREATE INDEX IF NOT EXISTS idx_location_history_user_location
  ON location_history (user_id, created_at DESC);

-- Composite index for nearby user queries
CREATE INDEX IF NOT EXISTS idx_profiles_active_location
  ON profiles (lat, lng)
  WHERE deleted_at IS NULL;

-- ──────────────────────────────────────────────
-- 6. PostGIS Views
-- ──────────────────────────────────────────────

-- Active user locations as GeoJSON-friendly view
CREATE OR REPLACE VIEW user_location_view AS
SELECT
  u.id AS user_id,
  p.display_name,
  p.avatar_url,
  p.lat,
  p.lng,
  ST_AsGeoJSON(p.location)::jsonb AS geometry,
  u.is_online,
  u.last_login_at,
  p.updated_at AS location_updated_at
FROM users u
JOIN profiles p ON p.user_id = u.id
WHERE u.deleted_at IS NULL
  AND p.deleted_at IS NULL
  AND p.lat IS NOT NULL
  AND p.lng IS NOT NULL;

-- Nearby users query helper (requires lat/lng params)
CREATE OR REPLACE FUNCTION find_nearby_users(
  center_lat double precision,
  center_lng double precision,
  radius_meters double precision DEFAULT 1000,
  exclude_user_id uuid DEFAULT NULL,
  max_results int DEFAULT 50
)
RETURNS TABLE(
  user_id uuid,
  display_name varchar,
  avatar_url varchar,
  distance_meters double precision,
  lat double precision,
  lng double precision,
  is_online boolean
)
LANGUAGE SQL STABLE
AS $$
  SELECT
    u.id,
    p.display_name,
    p.avatar_url,
    ST_Distance(
      p.location:: geography,
      ST_SetSRID(ST_MakePoint(center_lng, center_lat), 4326):: geography
    ) AS distance_meters,
    p.lat,
    p.lng,
    u.is_online
  FROM users u
  JOIN profiles p ON p.user_id = u.id
  WHERE u.deleted_at IS NULL
    AND p.deleted_at IS NULL
    AND p.lat IS NOT NULL
    AND p.lng IS NOT NULL
    AND (exclude_user_id IS NULL OR u.id <> exclude_user_id)
    AND ST_DWithin(
      p.location:: geography,
      ST_SetSRID(ST_MakePoint(center_lng, center_lat), 4326):: geography,
      radius_meters
    )
  ORDER BY distance_meters ASC
  LIMIT max_results;
$$;

-- Count users within a radius (for analytics/heatmaps)
CREATE OR REPLACE FUNCTION count_users_in_radius(
  center_lat double precision,
  center_lng double precision,
  radius_meters double precision DEFAULT 1000
)
RETURNS integer
LANGUAGE SQL STABLE
AS $$
  SELECT COUNT(*)::integer
  FROM users u
  JOIN profiles p ON p.user_id = u.id
  WHERE u.deleted_at IS NULL
    AND p.deleted_at IS NULL
    AND p.lat IS NOT NULL
    AND p.lng IS NOT NULL
    AND ST_DWithin(
      p.location:: geography,
      ST_SetSRID(ST_MakePoint(center_lng, center_lat), 4326):: geography,
      radius_meters
    );
$$;

-- ──────────────────────────────────────────────
-- 7. Seed Data
-- ──────────────────────────────────────────────

-- Default roles
INSERT INTO roles (id, name, description, is_default)
VALUES
  (uuid_generate_v4(), 'user',       'Standard application user',       true),
  (uuid_generate_v4(), 'moderator',  'Content moderator',               false),
  (uuid_generate_v4(), 'admin',      'System administrator',            false)
ON CONFLICT (name) DO NOTHING;

-- Base permissions
INSERT INTO permissions (id, action, resource, description) VALUES
  (uuid_generate_v4(), 'user:read',        'user',        'View user profiles'),
  (uuid_generate_v4(), 'user:write',       'user',        'Update own profile'),
  (uuid_generate_v4(), 'user:delete',      'user',        'Delete account'),
  (uuid_generate_v4(), 'place:read',       'place',       'View places'),
  (uuid_generate_v4(), 'place:create',     'place',       'Create places'),
  (uuid_generate_v4(), 'place:update',     'place',       'Update places'),
  (uuid_generate_v4(), 'place:delete',     'place',       'Delete places'),
  (uuid_generate_v4(), 'place:approve',    'place',       'Approve/reject places'),
  (uuid_generate_v4(), 'report:read',      'report',      'View reports'),
  (uuid_generate_v4(), 'report:resolve',   'report',      'Resolve reports'),
  (uuid_generate_v4(), 'user:manage',      'user',        'Manage all users'),
  (uuid_generate_v4(), 'system:config',    'system',      'System configuration')
ON CONFLICT (action) DO NOTHING;

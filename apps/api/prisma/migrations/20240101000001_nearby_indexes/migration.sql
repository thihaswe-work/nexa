-- ──────────────────────────────────────────────
-- Nexa Database: Nearby Feature Indexes
-- ──────────────────────────────────────────────

-- Composite index for nearby queries filtering active users
CREATE INDEX IF NOT EXISTS idx_users_active_nearby
  ON users (is_active, is_online, last_login_at)
  WHERE deleted_at IS NULL;

-- Composite index for privacy_settings location visibility
CREATE INDEX IF NOT EXISTS idx_privacy_settings_location
  ON privacy_settings (user_id, show_location);

-- Composite index for profile nearby visibility + location
CREATE INDEX IF NOT EXISTS idx_profiles_nearby_visible
  ON profiles (is_nearby_visible, lat, lng)
  WHERE deleted_at IS NULL AND lat IS NOT NULL AND lng IS NOT NULL;

-- TopStrike Squad Viewer - Initial Database Schema
-- Created: 2026-03-06

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- USERS TABLE
-- =====================================================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  twitter_id TEXT UNIQUE NOT NULL,
  twitter_username TEXT NOT NULL,
  twitter_handle TEXT,
  twitter_avatar_url TEXT,
  wallet_address TEXT, -- Manually linked by user
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster wallet lookups
CREATE INDEX idx_users_wallet ON users(wallet_address);
CREATE INDEX idx_users_twitter_id ON users(twitter_id);

-- =====================================================
-- GAMEWEEKS TABLE
-- =====================================================
CREATE TABLE gameweeks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  week_number INTEGER UNIQUE NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  lock_deadline TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Only one gameweek can be active at a time
CREATE UNIQUE INDEX idx_active_gameweek ON gameweeks(is_active) WHERE is_active = TRUE;

-- =====================================================
-- SQUADS TABLE
-- =====================================================
CREATE TABLE squads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  formation TEXT NOT NULL DEFAULT '4-3-3',
  players JSONB NOT NULL DEFAULT '{}', -- {position: playerId} mapping
  total_points INTEGER DEFAULT 0, -- All-time total points
  is_locked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- One squad per user
  UNIQUE(user_id)
);

-- Index for faster user squad lookups
CREATE INDEX idx_squads_user_id ON squads(user_id);

-- =====================================================
-- USER GAMEWEEK POINTS TABLE (for leaderboard)
-- =====================================================
CREATE TABLE user_gameweek_points (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  gameweek_id UUID NOT NULL REFERENCES gameweeks(id) ON DELETE CASCADE,
  points INTEGER DEFAULT 0,
  squad_snapshot JSONB, -- Store squad state for that gameweek
  calculated_at TIMESTAMP WITH TIME ZONE,

  -- One entry per user per gameweek
  UNIQUE(user_id, gameweek_id)
);

-- Indexes for leaderboard queries
CREATE INDEX idx_user_gameweek_points_user ON user_gameweek_points(user_id);
CREATE INDEX idx_user_gameweek_points_gameweek ON user_gameweek_points(gameweek_id);
CREATE INDEX idx_user_gameweek_points_points ON user_gameweek_points(points DESC);

-- =====================================================
-- FUNCTIONS & TRIGGERS
-- =====================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to users table
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Apply to squads table
CREATE TRIGGER update_squads_updated_at
  BEFORE UPDATE ON squads
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE squads ENABLE ROW LEVEL SECURITY;
ALTER TABLE gameweeks ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_gameweek_points ENABLE ROW LEVEL SECURITY;

-- Users: Anyone can read, users can update their own profile
CREATE POLICY "Users are viewable by everyone"
  ON users FOR SELECT
  USING (true);

CREATE POLICY "Users can update their own profile"
  ON users FOR UPDATE
  USING (auth.uid()::text = twitter_id);

CREATE POLICY "Users can insert their own profile"
  ON users FOR INSERT
  WITH CHECK (auth.uid()::text = twitter_id);

-- Squads: Anyone can read, users can manage their own squad
CREATE POLICY "Squads are viewable by everyone"
  ON squads FOR SELECT
  USING (true);

CREATE POLICY "Users can update their own squad"
  ON squads FOR UPDATE
  USING (user_id IN (SELECT id FROM users WHERE twitter_id = auth.uid()::text));

CREATE POLICY "Users can insert their own squad"
  ON squads FOR INSERT
  WITH CHECK (user_id IN (SELECT id FROM users WHERE twitter_id = auth.uid()::text));

CREATE POLICY "Users can delete their own squad"
  ON squads FOR DELETE
  USING (user_id IN (SELECT id FROM users WHERE twitter_id = auth.uid()::text));

-- Gameweeks: Everyone can read, only admins can write (disable write for now)
CREATE POLICY "Gameweeks are viewable by everyone"
  ON gameweeks FOR SELECT
  USING (true);

-- User Gameweek Points: Everyone can read
CREATE POLICY "User gameweek points are viewable by everyone"
  ON user_gameweek_points FOR SELECT
  USING (true);

-- =====================================================
-- HELPER VIEWS
-- =====================================================

-- Leaderboard view (current gameweek)
CREATE OR REPLACE VIEW leaderboard_current AS
SELECT
  u.id,
  u.twitter_username,
  u.twitter_handle,
  u.twitter_avatar_url,
  u.wallet_address,
  ugp.points,
  ugp.gameweek_id,
  gw.week_number,
  s.formation,
  RANK() OVER (ORDER BY ugp.points DESC) as rank
FROM users u
JOIN squads s ON s.user_id = u.id
JOIN user_gameweek_points ugp ON ugp.user_id = u.id
JOIN gameweeks gw ON gw.id = ugp.gameweek_id
WHERE gw.is_active = TRUE
ORDER BY ugp.points DESC;

-- Leaderboard view (all-time)
CREATE OR REPLACE VIEW leaderboard_alltime AS
SELECT
  u.id,
  u.twitter_username,
  u.twitter_handle,
  u.twitter_avatar_url,
  u.wallet_address,
  s.total_points,
  s.formation,
  RANK() OVER (ORDER BY s.total_points DESC) as rank
FROM users u
JOIN squads s ON s.user_id = u.id
ORDER BY s.total_points DESC;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE users IS 'Twitter OAuth users with optional wallet links';
COMMENT ON TABLE squads IS 'User squads - one per user, updated over time';
COMMENT ON TABLE gameweeks IS 'Weekly competition periods';
COMMENT ON TABLE user_gameweek_points IS 'Points earned per user per gameweek for leaderboard';
COMMENT ON VIEW leaderboard_current IS 'Current gameweek leaderboard';
COMMENT ON VIEW leaderboard_alltime IS 'All-time total points leaderboard';

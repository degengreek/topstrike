-- Player Scores Table
-- Stores most recent match scores from TopStrike API
-- Created: 2026-03-07

CREATE TABLE player_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  player_id TEXT NOT NULL,  -- TopStrike tokenId
  player_name TEXT NOT NULL,
  most_recent_score INTEGER DEFAULT 0,
  match_date DATE,
  match_opponent TEXT,
  match_state TEXT,  -- 'FT', 'LIVE', etc.
  last_updated TIMESTAMP DEFAULT NOW(),
  UNIQUE(player_id)
);

-- Index for faster lookups
CREATE INDEX idx_player_scores_player_id ON player_scores(player_id);
CREATE INDEX idx_player_scores_updated ON player_scores(last_updated);

-- Enable Row Level Security
ALTER TABLE player_scores ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read scores (public data)
CREATE POLICY "Public read access"
  ON player_scores
  FOR SELECT
  TO public
  USING (true);

-- Policy: Only service role can insert/update scores
CREATE POLICY "Service role can insert/update"
  ON player_scores
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Comment
COMMENT ON TABLE player_scores IS 'Stores most recent match scores for players from TopStrike API';

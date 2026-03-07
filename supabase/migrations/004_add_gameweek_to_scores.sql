-- Add gameweek_id to player_scores table
-- This allows tracking scores per gameweek (historical data)
-- Created: 2026-03-07

-- Add gameweek_id column
ALTER TABLE player_scores
ADD COLUMN gameweek_id UUID REFERENCES gameweeks(id);

-- Create index for faster queries
CREATE INDEX idx_player_scores_gameweek ON player_scores(gameweek_id);

-- Update unique constraint to include gameweek
-- Drop old constraint
ALTER TABLE player_scores DROP CONSTRAINT IF EXISTS player_scores_player_id_key;

-- Add new compound unique constraint (player can have one score per gameweek)
ALTER TABLE player_scores
ADD CONSTRAINT player_scores_player_gameweek_unique
UNIQUE(player_id, gameweek_id);

-- Comment
COMMENT ON COLUMN player_scores.gameweek_id IS 'Links score to specific gameweek for historical tracking';

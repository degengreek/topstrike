-- Create injury_status table for tracking player injuries and suspensions
-- This table stores ONLY players from TopStrike database (185 players)
-- Updated daily via automated sync script

CREATE TABLE IF NOT EXISTS public.injury_status (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  player_id text NOT NULL,
  player_name text NOT NULL,
  team text NULL,
  position text NULL,
  injury_status text NOT NULL CHECK (injury_status IN ('injured', 'suspended')),
  injury_type text NULL,
  expected_return date NULL,
  last_updated timestamp without time zone NULL DEFAULT now(),
  created_at timestamp without time zone NULL DEFAULT now(),
  CONSTRAINT injury_status_pkey PRIMARY KEY (id),
  CONSTRAINT injury_status_player_id_unique UNIQUE (player_id)
);

-- Create indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_injury_status_player_id ON public.injury_status USING btree (player_id);
CREATE INDEX IF NOT EXISTS idx_injury_status_status ON public.injury_status USING btree (injury_status);
CREATE INDEX IF NOT EXISTS idx_injury_status_return ON public.injury_status USING btree (expected_return);
CREATE INDEX IF NOT EXISTS idx_injury_status_updated ON public.injury_status USING btree (last_updated);

-- Enable Row Level Security
ALTER TABLE public.injury_status ENABLE ROW LEVEL SECURITY;

-- Policy: Allow public read access (anyone can view injury data)
CREATE POLICY "Allow public read access" ON public.injury_status
  FOR SELECT
  USING (true);

-- Policy: Allow service role to write (for sync script)
CREATE POLICY "Allow service role write" ON public.injury_status
  FOR ALL
  USING (auth.role() = 'service_role');

-- Add comment to table
COMMENT ON TABLE public.injury_status IS 'Tracks injuries and suspensions for TopStrike players. Updated daily via automated sync script.';

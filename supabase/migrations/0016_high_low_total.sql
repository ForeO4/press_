-- High-Low-Total Game Support
-- Adds tables for storing HLT game settings and per-hole results

-- High-Low-Total game settings
CREATE TABLE IF NOT EXISTS high_low_total_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  tie_rule TEXT NOT NULL DEFAULT 'push'
    CHECK (tie_rule IN ('push', 'split', 'carryover')),
  is_team_mode BOOLEAN NOT NULL DEFAULT FALSE,
  point_value INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (game_id)
);

-- Per-hole results tracking
CREATE TABLE IF NOT EXISTS high_low_total_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  hole_number INTEGER NOT NULL CHECK (hole_number >= 1 AND hole_number <= 18),
  low_winner_id UUID,
  high_loser_id UUID,
  total_winner_id UUID,
  carryover_low INTEGER DEFAULT 0,
  carryover_high INTEGER DEFAULT 0,
  carryover_total INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (game_id, hole_number)
);

-- Indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_hlt_settings_game ON high_low_total_settings(game_id);
CREATE INDEX IF NOT EXISTS idx_hlt_results_game ON high_low_total_results(game_id);
CREATE INDEX IF NOT EXISTS idx_hlt_results_hole ON high_low_total_results(game_id, hole_number);

-- Enable RLS
ALTER TABLE high_low_total_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE high_low_total_results ENABLE ROW LEVEL SECURITY;

-- RLS policies for high_low_total_settings
CREATE POLICY "Users can view HLT settings for events they're members of"
  ON high_low_total_settings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM games g
      JOIN event_members em ON g.event_id = em.event_id
      WHERE g.id = high_low_total_settings.game_id
        AND em.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert HLT settings for games in their events"
  ON high_low_total_settings FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM games g
      JOIN event_members em ON g.event_id = em.event_id
      WHERE g.id = high_low_total_settings.game_id
        AND em.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update HLT settings for games in their events"
  ON high_low_total_settings FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM games g
      JOIN event_members em ON g.event_id = em.event_id
      WHERE g.id = high_low_total_settings.game_id
        AND em.user_id = auth.uid()
    )
  );

-- RLS policies for high_low_total_results
CREATE POLICY "Users can view HLT results for events they're members of"
  ON high_low_total_results FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM games g
      JOIN event_members em ON g.event_id = em.event_id
      WHERE g.id = high_low_total_results.game_id
        AND em.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert HLT results for games in their events"
  ON high_low_total_results FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM games g
      JOIN event_members em ON g.event_id = em.event_id
      WHERE g.id = high_low_total_results.game_id
        AND em.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update HLT results for games in their events"
  ON high_low_total_results FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM games g
      JOIN event_members em ON g.event_id = em.event_id
      WHERE g.id = high_low_total_results.game_id
        AND em.user_id = auth.uid()
    )
  );

-- Nassau Game Support
-- Adds tables for storing Nassau game settings and per-bet/hole results
-- Nassau is a 3-bet match play format: Front 9, Back 9, Overall 18

-- Nassau game settings
CREATE TABLE IF NOT EXISTS nassau_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  team_format TEXT NOT NULL DEFAULT 'individual'
    CHECK (team_format IN ('individual', 'best_ball', 'both_balls')),
  max_presses INTEGER NOT NULL DEFAULT 2 CHECK (max_presses BETWEEN 1 AND 5),
  scoring_basis TEXT NOT NULL DEFAULT 'net'
    CHECK (scoring_basis IN ('net', 'gross')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (game_id)
);

-- Nassau bet results (Front, Back, Overall)
CREATE TABLE IF NOT EXISTS nassau_bet_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  bet_type TEXT NOT NULL CHECK (bet_type IN ('front', 'back', 'overall')),
  winner_id UUID,  -- NULL if halved
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'won', 'halved')),
  holes_up INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (game_id, bet_type)
);

-- Nassau per-hole results for tracking match play status
CREATE TABLE IF NOT EXISTS nassau_hole_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  hole_number INTEGER NOT NULL CHECK (hole_number BETWEEN 1 AND 18),
  winner_id UUID,  -- NULL if halved
  -- Running tallies for each bet segment
  front_holes_up INTEGER NOT NULL DEFAULT 0,  -- For holes 1-9
  back_holes_up INTEGER NOT NULL DEFAULT 0,   -- For holes 10-18
  overall_holes_up INTEGER NOT NULL DEFAULT 0, -- For all 18
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (game_id, hole_number)
);

-- Indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_nassau_settings_game ON nassau_settings(game_id);
CREATE INDEX IF NOT EXISTS idx_nassau_bet_results_game ON nassau_bet_results(game_id);
CREATE INDEX IF NOT EXISTS idx_nassau_hole_results_game ON nassau_hole_results(game_id);
CREATE INDEX IF NOT EXISTS idx_nassau_hole_results_hole ON nassau_hole_results(game_id, hole_number);

-- Enable RLS
ALTER TABLE nassau_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE nassau_bet_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE nassau_hole_results ENABLE ROW LEVEL SECURITY;

-- RLS policies for nassau_settings
CREATE POLICY "Users can view Nassau settings for events they're members of"
  ON nassau_settings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM games g
      JOIN event_memberships em ON g.event_id = em.event_id
      WHERE g.id = nassau_settings.game_id
        AND em.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert Nassau settings for games in their events"
  ON nassau_settings FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM games g
      JOIN event_memberships em ON g.event_id = em.event_id
      WHERE g.id = nassau_settings.game_id
        AND em.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update Nassau settings for games in their events"
  ON nassau_settings FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM games g
      JOIN event_memberships em ON g.event_id = em.event_id
      WHERE g.id = nassau_settings.game_id
        AND em.user_id = auth.uid()
    )
  );

-- RLS policies for nassau_bet_results
CREATE POLICY "Users can view Nassau bet results for events they're members of"
  ON nassau_bet_results FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM games g
      JOIN event_memberships em ON g.event_id = em.event_id
      WHERE g.id = nassau_bet_results.game_id
        AND em.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert Nassau bet results for games in their events"
  ON nassau_bet_results FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM games g
      JOIN event_memberships em ON g.event_id = em.event_id
      WHERE g.id = nassau_bet_results.game_id
        AND em.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update Nassau bet results for games in their events"
  ON nassau_bet_results FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM games g
      JOIN event_memberships em ON g.event_id = em.event_id
      WHERE g.id = nassau_bet_results.game_id
        AND em.user_id = auth.uid()
    )
  );

-- RLS policies for nassau_hole_results
CREATE POLICY "Users can view Nassau hole results for events they're members of"
  ON nassau_hole_results FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM games g
      JOIN event_memberships em ON g.event_id = em.event_id
      WHERE g.id = nassau_hole_results.game_id
        AND em.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert Nassau hole results for games in their events"
  ON nassau_hole_results FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM games g
      JOIN event_memberships em ON g.event_id = em.event_id
      WHERE g.id = nassau_hole_results.game_id
        AND em.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update Nassau hole results for games in their events"
  ON nassau_hole_results FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM games g
      JOIN event_memberships em ON g.event_id = em.event_id
      WHERE g.id = nassau_hole_results.game_id
        AND em.user_id = auth.uid()
    )
  );

-- Trigger to update updated_at on nassau_bet_results
CREATE OR REPLACE FUNCTION update_nassau_bet_results_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER nassau_bet_results_updated_at
  BEFORE UPDATE ON nassau_bet_results
  FOR EACH ROW
  EXECUTE FUNCTION update_nassau_bet_results_updated_at();

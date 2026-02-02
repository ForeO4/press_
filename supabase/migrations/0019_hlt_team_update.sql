-- High-Low-Total Team Update
-- Updates HLT to support 2v2 team-based Low Ball/High Ball/Total scoring
-- HLT is now:
-- - 4 players exactly
-- - 2v2 teams
-- - Net scoring only
-- - 18 holes only
-- - Wash on ties (no carryover, no split)

-- Drop old tables (they had incompatible structure)
DROP TABLE IF EXISTS high_low_total_results;
DROP TABLE IF EXISTS high_low_total_settings;

-- New HLT settings with team assignments
CREATE TABLE IF NOT EXISTS hlt_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  point_value INTEGER NOT NULL DEFAULT 10,
  -- Team 1 players
  team1_player1_id UUID NOT NULL,
  team1_player2_id UUID NOT NULL,
  -- Team 2 players
  team2_player1_id UUID NOT NULL,
  team2_player2_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (game_id)
);

-- New HLT per-hole results with team-based scoring
CREATE TABLE IF NOT EXISTS hlt_hole_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  hole_number INTEGER NOT NULL CHECK (hole_number BETWEEN 1 AND 18),
  -- Team 1 scores (net)
  team1_low INTEGER,  -- Best individual score
  team1_high INTEGER, -- Worst individual score
  team1_total INTEGER, -- Combined score
  -- Team 2 scores (net)
  team2_low INTEGER,
  team2_high INTEGER,
  team2_total INTEGER,
  -- Point winners (NULL = wash/tie, 1 = Team 1, 2 = Team 2)
  low_ball_winner SMALLINT CHECK (low_ball_winner IS NULL OR low_ball_winner IN (1, 2)),
  high_ball_winner SMALLINT CHECK (high_ball_winner IS NULL OR high_ball_winner IN (1, 2)),
  total_winner SMALLINT CHECK (total_winner IS NULL OR total_winner IN (1, 2)),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (game_id, hole_number)
);

-- Team standings (denormalized for faster queries)
CREATE TABLE IF NOT EXISTS hlt_team_standings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  team_number SMALLINT NOT NULL CHECK (team_number IN (1, 2)),
  low_ball_points INTEGER NOT NULL DEFAULT 0,
  high_ball_points INTEGER NOT NULL DEFAULT 0,
  total_points INTEGER NOT NULL DEFAULT 0,
  net_points INTEGER NOT NULL DEFAULT 0,  -- lowBall + highBall + total
  net_value INTEGER NOT NULL DEFAULT 0,   -- netPoints × pointValue
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (game_id, team_number)
);

-- Indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_hlt_settings_game ON hlt_settings(game_id);
CREATE INDEX IF NOT EXISTS idx_hlt_hole_results_game ON hlt_hole_results(game_id);
CREATE INDEX IF NOT EXISTS idx_hlt_hole_results_hole ON hlt_hole_results(game_id, hole_number);
CREATE INDEX IF NOT EXISTS idx_hlt_team_standings_game ON hlt_team_standings(game_id);

-- Enable RLS
ALTER TABLE hlt_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE hlt_hole_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE hlt_team_standings ENABLE ROW LEVEL SECURITY;

-- RLS policies for hlt_settings
CREATE POLICY "Users can view HLT settings for events they're members of"
  ON hlt_settings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM games g
      JOIN event_memberships em ON g.event_id = em.event_id
      WHERE g.id = hlt_settings.game_id
        AND em.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert HLT settings for games in their events"
  ON hlt_settings FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM games g
      JOIN event_memberships em ON g.event_id = em.event_id
      WHERE g.id = hlt_settings.game_id
        AND em.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update HLT settings for games in their events"
  ON hlt_settings FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM games g
      JOIN event_memberships em ON g.event_id = em.event_id
      WHERE g.id = hlt_settings.game_id
        AND em.user_id = auth.uid()
    )
  );

-- RLS policies for hlt_hole_results
CREATE POLICY "Users can view HLT hole results for events they're members of"
  ON hlt_hole_results FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM games g
      JOIN event_memberships em ON g.event_id = em.event_id
      WHERE g.id = hlt_hole_results.game_id
        AND em.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert HLT hole results for games in their events"
  ON hlt_hole_results FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM games g
      JOIN event_memberships em ON g.event_id = em.event_id
      WHERE g.id = hlt_hole_results.game_id
        AND em.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update HLT hole results for games in their events"
  ON hlt_hole_results FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM games g
      JOIN event_memberships em ON g.event_id = em.event_id
      WHERE g.id = hlt_hole_results.game_id
        AND em.user_id = auth.uid()
    )
  );

-- RLS policies for hlt_team_standings
CREATE POLICY "Users can view HLT team standings for events they're members of"
  ON hlt_team_standings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM games g
      JOIN event_memberships em ON g.event_id = em.event_id
      WHERE g.id = hlt_team_standings.game_id
        AND em.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert HLT team standings for games in their events"
  ON hlt_team_standings FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM games g
      JOIN event_memberships em ON g.event_id = em.event_id
      WHERE g.id = hlt_team_standings.game_id
        AND em.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update HLT team standings for games in their events"
  ON hlt_team_standings FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM games g
      JOIN event_memberships em ON g.event_id = em.event_id
      WHERE g.id = hlt_team_standings.game_id
        AND em.user_id = auth.uid()
    )
  );

-- Trigger to update updated_at on hlt_team_standings
CREATE OR REPLACE FUNCTION update_hlt_team_standings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER hlt_team_standings_updated_at
  BEFORE UPDATE ON hlt_team_standings
  FOR EACH ROW
  EXECUTE FUNCTION update_hlt_team_standings_updated_at();

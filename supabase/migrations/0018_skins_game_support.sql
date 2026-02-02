-- Skins Game Support
-- Adds tables for storing Skins game settings and per-hole results with carryover tracking
-- Win a skin by having the outright lowest score; ties carry over to next hole

-- Skins game settings
CREATE TABLE IF NOT EXISTS skins_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  game_length INTEGER NOT NULL DEFAULT 18
    CHECK (game_length IN (9, 18)),
  carryover BOOLEAN NOT NULL DEFAULT TRUE,
  scoring_basis TEXT NOT NULL DEFAULT 'gross'
    CHECK (scoring_basis IN ('net', 'gross')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (game_id)
);

-- Skins per-hole results
CREATE TABLE IF NOT EXISTS skins_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  hole_number INTEGER NOT NULL CHECK (hole_number BETWEEN 1 AND 18),
  winner_id UUID,  -- NULL if carryover (no outright winner)
  skin_value INTEGER NOT NULL DEFAULT 1,  -- 1 + accumulated carryovers
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (game_id, hole_number)
);

-- Skins player totals (denormalized for faster queries)
CREATE TABLE IF NOT EXISTS skins_player_totals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  player_id UUID NOT NULL,  -- Can be user_id or guest_player_id
  is_guest BOOLEAN NOT NULL DEFAULT FALSE,
  skins_won INTEGER NOT NULL DEFAULT 0,
  skin_values_won INTEGER NOT NULL DEFAULT 0,  -- Total value including carryovers
  net_amount INTEGER NOT NULL DEFAULT 0,  -- Gator Bucks won/lost
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (game_id, player_id)
);

-- Indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_skins_settings_game ON skins_settings(game_id);
CREATE INDEX IF NOT EXISTS idx_skins_results_game ON skins_results(game_id);
CREATE INDEX IF NOT EXISTS idx_skins_results_hole ON skins_results(game_id, hole_number);
CREATE INDEX IF NOT EXISTS idx_skins_results_winner ON skins_results(winner_id) WHERE winner_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_skins_player_totals_game ON skins_player_totals(game_id);

-- Enable RLS
ALTER TABLE skins_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE skins_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE skins_player_totals ENABLE ROW LEVEL SECURITY;

-- RLS policies for skins_settings
CREATE POLICY "Users can view Skins settings for events they're members of"
  ON skins_settings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM games g
      JOIN event_memberships em ON g.event_id = em.event_id
      WHERE g.id = skins_settings.game_id
        AND em.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert Skins settings for games in their events"
  ON skins_settings FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM games g
      JOIN event_memberships em ON g.event_id = em.event_id
      WHERE g.id = skins_settings.game_id
        AND em.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update Skins settings for games in their events"
  ON skins_settings FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM games g
      JOIN event_memberships em ON g.event_id = em.event_id
      WHERE g.id = skins_settings.game_id
        AND em.user_id = auth.uid()
    )
  );

-- RLS policies for skins_results
CREATE POLICY "Users can view Skins results for events they're members of"
  ON skins_results FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM games g
      JOIN event_memberships em ON g.event_id = em.event_id
      WHERE g.id = skins_results.game_id
        AND em.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert Skins results for games in their events"
  ON skins_results FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM games g
      JOIN event_memberships em ON g.event_id = em.event_id
      WHERE g.id = skins_results.game_id
        AND em.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update Skins results for games in their events"
  ON skins_results FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM games g
      JOIN event_memberships em ON g.event_id = em.event_id
      WHERE g.id = skins_results.game_id
        AND em.user_id = auth.uid()
    )
  );

-- RLS policies for skins_player_totals
CREATE POLICY "Users can view Skins player totals for events they're members of"
  ON skins_player_totals FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM games g
      JOIN event_memberships em ON g.event_id = em.event_id
      WHERE g.id = skins_player_totals.game_id
        AND em.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert Skins player totals for games in their events"
  ON skins_player_totals FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM games g
      JOIN event_memberships em ON g.event_id = em.event_id
      WHERE g.id = skins_player_totals.game_id
        AND em.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update Skins player totals for games in their events"
  ON skins_player_totals FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM games g
      JOIN event_memberships em ON g.event_id = em.event_id
      WHERE g.id = skins_player_totals.game_id
        AND em.user_id = auth.uid()
    )
  );

-- Trigger to update updated_at on skins_player_totals
CREATE OR REPLACE FUNCTION update_skins_player_totals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER skins_player_totals_updated_at
  BEFORE UPDATE ON skins_player_totals
  FOR EACH ROW
  EXECUTE FUNCTION update_skins_player_totals_updated_at();

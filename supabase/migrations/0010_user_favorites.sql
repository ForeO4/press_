-- Press! User Favorites & Player Stats
-- Migration: 0010_user_favorites.sql
-- Adds user favorites table and player stats RPC function

-- ============================================
-- USER FAVORITES
-- ============================================

-- User favorite clubhouses/events
CREATE TABLE user_favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, event_id)
);

-- Index for efficient lookup
CREATE INDEX idx_user_favorites_user_id ON user_favorites(user_id);
CREATE INDEX idx_user_favorites_event_id ON user_favorites(event_id);

-- RLS policies for user_favorites
ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;

-- Users can view their own favorites
CREATE POLICY "Users can view own favorites" ON user_favorites
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own favorites
CREATE POLICY "Users can insert own favorites" ON user_favorites
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can delete their own favorites
CREATE POLICY "Users can delete own favorites" ON user_favorites
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- PLAYER CAREER STATS RPC
-- ============================================

-- RPC function to get player career stats efficiently
CREATE OR REPLACE FUNCTION get_player_career_stats(
  p_user_id UUID,
  p_period TEXT DEFAULT 'lifetime'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_date_filter DATE;
  v_result JSON;
BEGIN
  -- Set date filter based on period
  CASE p_period
    WHEN 'today' THEN
      v_date_filter := CURRENT_DATE;
    WHEN 'ytd' THEN
      v_date_filter := DATE_TRUNC('year', CURRENT_DATE)::DATE;
    ELSE
      v_date_filter := NULL; -- lifetime
  END CASE;

  -- Build stats result
  WITH round_scores AS (
    SELECT
      r.id as round_id,
      r.event_id,
      r.round_date,
      hs.hole_number,
      hs.strokes,
      COALESCE((
        SELECT (h->>'par')::INT
        FROM event_tee_snapshots ets,
             jsonb_array_elements(ets.snapshot_data->'holes') as h
        WHERE ets.event_id = r.event_id
        AND (h->>'number')::INT = hs.hole_number
        LIMIT 1
      ), 4) as par
    FROM rounds r
    JOIN hole_scores hs ON hs.round_id = r.id
    WHERE r.user_id = p_user_id
    AND (v_date_filter IS NULL OR r.round_date >= v_date_filter)
  ),
  score_breakdown AS (
    SELECT
      COUNT(DISTINCT round_id) as total_rounds,
      COUNT(*) FILTER (WHERE strokes - par <= -2) as eagles,
      COUNT(*) FILTER (WHERE strokes - par = -1) as birdies,
      COUNT(*) FILTER (WHERE strokes - par = 0) as pars,
      COUNT(*) FILTER (WHERE strokes - par = 1) as bogeys,
      COUNT(*) FILTER (WHERE strokes - par = 2) as double_bogeys,
      COUNT(*) FILTER (WHERE strokes - par >= 3) as triple_plus,
      CASE
        WHEN COUNT(DISTINCT round_id) > 0
        THEN ROUND(SUM(strokes)::NUMERIC / COUNT(DISTINCT round_id), 0)
        ELSE NULL
      END as avg_score
    FROM round_scores
  ),
  game_stats AS (
    SELECT
      COUNT(*) FILTER (WHERE payee_id = p_user_id) as wins,
      COUNT(*) FILTER (WHERE payer_id = p_user_id) as losses,
      COALESCE(
        SUM(CASE WHEN payee_id = p_user_id THEN amount_int ELSE 0 END) -
        SUM(CASE WHEN payer_id = p_user_id THEN amount_int ELSE 0 END),
        0
      ) as total_winnings
    FROM settlements
    WHERE (payer_id = p_user_id OR payee_id = p_user_id)
    AND (v_date_filter IS NULL OR created_at >= v_date_filter)
  )
  SELECT json_build_object(
    'totalRounds', sb.total_rounds,
    'eagles', sb.eagles,
    'birdies', sb.birdies,
    'pars', sb.pars,
    'bogeys', sb.bogeys,
    'doubleBogeys', sb.double_bogeys,
    'triplePlus', sb.triple_plus,
    'avgScore', sb.avg_score,
    'gamesPlayed', COALESCE(gs.wins, 0) + COALESCE(gs.losses, 0),
    'wins', COALESCE(gs.wins, 0),
    'losses', COALESCE(gs.losses, 0),
    'totalWinnings', COALESCE(gs.total_winnings, 0)
  ) INTO v_result
  FROM score_breakdown sb
  CROSS JOIN game_stats gs;

  RETURN v_result;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_player_career_stats(UUID, TEXT) TO authenticated;

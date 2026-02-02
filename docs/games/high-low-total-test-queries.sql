-- ============================================
-- HIGH-LOW-TOTAL TEST QUERIES
-- Run these in your Supabase SQL Editor to test the HLT game flow
-- ============================================

-- 1. VIEW EXISTING TABLES
-- Check that the HLT tables were created
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name LIKE 'high_low%';

-- 2. VIEW TABLE STRUCTURE
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'high_low_total_settings'
ORDER BY ordinal_position;

SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'high_low_total_results'
ORDER BY ordinal_position;

-- ============================================
-- CREATE TEST DATA
-- ============================================

-- 3. First, find an existing event and game to work with
-- (Replace the IDs below with your actual IDs)
SELECT id, name, type, status FROM games LIMIT 5;
SELECT id, name, date FROM events LIMIT 5;

-- 4. INSERT HLT GAME SETTINGS (replace game_id with actual ID)
-- Example: Create settings for a HLT game
/*
INSERT INTO high_low_total_settings (game_id, tie_rule, is_team_mode, point_value)
VALUES (
  'YOUR-GAME-ID-HERE',
  'push',      -- Options: 'push', 'split', 'carryover'
  false,       -- false = individual mode, true = team mode (2v2)
  10           -- Gator Bucks per point
)
ON CONFLICT (game_id) DO UPDATE SET
  tie_rule = EXCLUDED.tie_rule,
  is_team_mode = EXCLUDED.is_team_mode,
  point_value = EXCLUDED.point_value;
*/

-- 5. INSERT HLT HOLE RESULTS (replace game_id and player IDs)
-- Example: Record results for holes 1-3
/*
INSERT INTO high_low_total_results (game_id, hole_number, low_winner_id, high_loser_id, total_winner_id, carryover_low, carryover_high, carryover_total)
VALUES
  ('YOUR-GAME-ID', 1, 'PLAYER-A-ID', 'PLAYER-C-ID', NULL, 0, 0, 0),
  ('YOUR-GAME-ID', 2, NULL, 'PLAYER-A-ID', NULL, 1, 0, 0),  -- Low was a tie, carryover
  ('YOUR-GAME-ID', 3, 'PLAYER-B-ID', 'PLAYER-C-ID', NULL, 0, 0, 0)
ON CONFLICT (game_id, hole_number) DO UPDATE SET
  low_winner_id = EXCLUDED.low_winner_id,
  high_loser_id = EXCLUDED.high_loser_id,
  total_winner_id = EXCLUDED.total_winner_id,
  carryover_low = EXCLUDED.carryover_low,
  carryover_high = EXCLUDED.carryover_high,
  carryover_total = EXCLUDED.carryover_total;
*/

-- ============================================
-- QUERY TEST DATA
-- ============================================

-- 6. VIEW ALL HLT SETTINGS
SELECT
  hlt.id,
  hlt.game_id,
  g.type as game_type,
  hlt.tie_rule,
  hlt.is_team_mode,
  hlt.point_value,
  hlt.created_at
FROM high_low_total_settings hlt
JOIN games g ON g.id = hlt.game_id
ORDER BY hlt.created_at DESC;

-- 7. VIEW HLT RESULTS FOR A GAME
SELECT
  r.hole_number,
  r.low_winner_id,
  r.high_loser_id,
  r.total_winner_id,
  r.carryover_low,
  r.carryover_high,
  r.carryover_total
FROM high_low_total_results r
-- WHERE r.game_id = 'YOUR-GAME-ID'
ORDER BY r.hole_number;

-- 8. COMPUTE HLT STANDINGS (aggregated query)
-- This shows how to compute standings from the results table
/*
WITH player_points AS (
  SELECT
    COALESCE(low_winner_id, high_loser_id) as player_id,
    SUM(CASE WHEN low_winner_id IS NOT NULL THEN 1 + carryover_low ELSE 0 END) as low_points,
    SUM(CASE WHEN high_loser_id IS NOT NULL THEN 1 + carryover_high ELSE 0 END) as high_points,
    SUM(CASE WHEN total_winner_id IS NOT NULL THEN 1 + carryover_total ELSE 0 END) as total_points
  FROM high_low_total_results
  WHERE game_id = 'YOUR-GAME-ID'
  GROUP BY COALESCE(low_winner_id, high_loser_id)
)
SELECT
  p.player_id,
  pr.full_name,
  p.low_points,
  p.high_points,
  p.total_points,
  (p.low_points + p.total_points - p.high_points) as net_points,
  (p.low_points + p.total_points - p.high_points) * s.point_value as net_value
FROM player_points p
LEFT JOIN profiles pr ON pr.id = p.player_id
CROSS JOIN high_low_total_settings s
WHERE s.game_id = 'YOUR-GAME-ID'
ORDER BY net_points DESC;
*/

-- ============================================
-- CLEANUP (use carefully!)
-- ============================================

-- 9. DELETE TEST DATA (uncomment to use)
-- DELETE FROM high_low_total_results WHERE game_id = 'YOUR-GAME-ID';
-- DELETE FROM high_low_total_settings WHERE game_id = 'YOUR-GAME-ID';

-- ============================================
-- USEFUL JOINS
-- ============================================

-- 10. VIEW GAMES WITH HLT SETTINGS
SELECT
  g.id as game_id,
  g.type,
  g.status,
  e.name as event_name,
  hlt.tie_rule,
  hlt.is_team_mode,
  hlt.point_value
FROM games g
JOIN events e ON e.id = g.event_id
LEFT JOIN high_low_total_settings hlt ON hlt.game_id = g.id
WHERE g.type = 'high_low_total'
ORDER BY g.created_at DESC;

-- 11. VIEW HOLE SCORES WITH HLT RESULTS
-- (Useful for debugging - shows raw scores alongside computed results)
/*
SELECT
  hs.hole_number,
  hs.user_id,
  pr.full_name,
  hs.strokes as gross_score,
  hlt.low_winner_id,
  hlt.high_loser_id,
  CASE WHEN hlt.low_winner_id = hs.user_id THEN 'LOW' ELSE '' END as is_low,
  CASE WHEN hlt.high_loser_id = hs.user_id THEN 'HIGH' ELSE '' END as is_high
FROM hole_scores hs
JOIN rounds r ON r.id = hs.round_id
JOIN profiles pr ON pr.id = hs.user_id
LEFT JOIN high_low_total_results hlt ON hlt.game_id = 'YOUR-GAME-ID' AND hlt.hole_number = hs.hole_number
WHERE r.event_id = 'YOUR-EVENT-ID'
ORDER BY hs.hole_number, pr.full_name;
*/

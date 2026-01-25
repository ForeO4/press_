-- Press! Seed Data
-- Demo event with sample users, games, and data

-- Note: This seed assumes demo users already exist in auth.users
-- In local development, you may need to create them via Supabase Auth first
-- For now, we'll use UUIDs that can be linked to real users later

-- ============================================
-- DEMO USER IDs (placeholders)
-- ============================================
-- These would be replaced with actual auth.users IDs in production
-- For local dev, create users with these emails and update IDs

DO $$
DECLARE
  v_owner_id UUID := '00000000-0000-0000-0000-000000000001';
  v_admin_id UUID := '00000000-0000-0000-0000-000000000002';
  v_player1_id UUID := '00000000-0000-0000-0000-000000000003';
  v_player2_id UUID := '00000000-0000-0000-0000-000000000004';
  v_event_id UUID;
  v_course_id UUID;
  v_tee_set_id UUID;
  v_round1_id UUID;
  v_round2_id UUID;
  v_round3_id UUID;
  v_round4_id UUID;
  v_game_id UUID;
  v_press_id UUID;
  v_thread_id UUID;
BEGIN

-- ============================================
-- CREATE DEMO EVENT
-- ============================================

INSERT INTO events (id, name, date, visibility, is_locked, created_by)
VALUES (
  uuid_generate_v4(),
  'Spring Classic 2024',
  '2024-04-15',
  'UNLISTED',
  FALSE,
  v_owner_id
) RETURNING id INTO v_event_id;

-- ============================================
-- EVENT MEMBERSHIPS
-- ============================================

INSERT INTO event_memberships (event_id, user_id, role, status) VALUES
  (v_event_id, v_owner_id, 'OWNER', 'ACTIVE'),
  (v_event_id, v_admin_id, 'ADMIN', 'ACTIVE'),
  (v_event_id, v_player1_id, 'PLAYER', 'ACTIVE'),
  (v_event_id, v_player2_id, 'PLAYER', 'ACTIVE');

-- ============================================
-- EVENT SETTINGS
-- ============================================

INSERT INTO event_settings (event_id, press_rules, default_teeth, allow_self_press)
VALUES (
  v_event_id,
  '{"auto_press_trigger": 2, "default_stake": 10}'::jsonb,
  100,
  TRUE
);

-- ============================================
-- COURSE DATA
-- ============================================

INSERT INTO courses (id, name, city, state, country)
VALUES (uuid_generate_v4(), 'Pine Valley Golf Club', 'Pine Valley', 'NJ', 'US')
RETURNING id INTO v_course_id;

INSERT INTO tee_sets (id, course_id, name, rating, slope)
VALUES (uuid_generate_v4(), v_course_id, 'Blue', 74.5, 145)
RETURNING id INTO v_tee_set_id;

-- Insert all 18 holes
INSERT INTO holes (tee_set_id, hole_number, par, handicap, yards) VALUES
  (v_tee_set_id, 1, 4, 7, 427),
  (v_tee_set_id, 2, 4, 11, 367),
  (v_tee_set_id, 3, 3, 15, 185),
  (v_tee_set_id, 4, 4, 3, 461),
  (v_tee_set_id, 5, 3, 13, 226),
  (v_tee_set_id, 6, 4, 9, 391),
  (v_tee_set_id, 7, 5, 1, 585),
  (v_tee_set_id, 8, 4, 5, 327),
  (v_tee_set_id, 9, 4, 17, 432),
  (v_tee_set_id, 10, 4, 8, 145),
  (v_tee_set_id, 11, 4, 6, 399),
  (v_tee_set_id, 12, 4, 16, 382),
  (v_tee_set_id, 13, 5, 2, 446),
  (v_tee_set_id, 14, 3, 14, 185),
  (v_tee_set_id, 15, 5, 4, 591),
  (v_tee_set_id, 16, 4, 12, 436),
  (v_tee_set_id, 17, 3, 18, 338),
  (v_tee_set_id, 18, 4, 10, 424);

-- ============================================
-- ROUNDS
-- ============================================

INSERT INTO rounds (id, event_id, user_id, tee_set_id, round_date)
VALUES (uuid_generate_v4(), v_event_id, v_owner_id, v_tee_set_id, '2024-04-15')
RETURNING id INTO v_round1_id;

INSERT INTO rounds (id, event_id, user_id, tee_set_id, round_date)
VALUES (uuid_generate_v4(), v_event_id, v_admin_id, v_tee_set_id, '2024-04-15')
RETURNING id INTO v_round2_id;

INSERT INTO rounds (id, event_id, user_id, tee_set_id, round_date)
VALUES (uuid_generate_v4(), v_event_id, v_player1_id, v_tee_set_id, '2024-04-15')
RETURNING id INTO v_round3_id;

INSERT INTO rounds (id, event_id, user_id, tee_set_id, round_date)
VALUES (uuid_generate_v4(), v_event_id, v_player2_id, v_tee_set_id, '2024-04-15')
RETURNING id INTO v_round4_id;

-- ============================================
-- SAMPLE SCORES (Front 9 only for demo)
-- ============================================

-- Owner scores (pretty good round)
INSERT INTO hole_scores (round_id, hole_number, strokes) VALUES
  (v_round1_id, 1, 4), (v_round1_id, 2, 4), (v_round1_id, 3, 3),
  (v_round1_id, 4, 5), (v_round1_id, 5, 3), (v_round1_id, 6, 4),
  (v_round1_id, 7, 5), (v_round1_id, 8, 4), (v_round1_id, 9, 4);

-- Admin scores
INSERT INTO hole_scores (round_id, hole_number, strokes) VALUES
  (v_round2_id, 1, 5), (v_round2_id, 2, 4), (v_round2_id, 3, 4),
  (v_round2_id, 4, 4), (v_round2_id, 5, 4), (v_round2_id, 6, 5),
  (v_round2_id, 7, 6), (v_round2_id, 8, 4), (v_round2_id, 9, 5);

-- Player 1 scores
INSERT INTO hole_scores (round_id, hole_number, strokes) VALUES
  (v_round3_id, 1, 5), (v_round3_id, 2, 5), (v_round3_id, 3, 3),
  (v_round3_id, 4, 5), (v_round3_id, 5, 4), (v_round3_id, 6, 4),
  (v_round3_id, 7, 5), (v_round3_id, 8, 5), (v_round3_id, 9, 4);

-- Player 2 scores
INSERT INTO hole_scores (round_id, hole_number, strokes) VALUES
  (v_round4_id, 1, 4), (v_round4_id, 2, 5), (v_round4_id, 3, 4),
  (v_round4_id, 4, 6), (v_round4_id, 5, 3), (v_round4_id, 6, 5),
  (v_round4_id, 7, 6), (v_round4_id, 8, 4), (v_round4_id, 9, 5);

-- ============================================
-- SAMPLE GAME (Match Play)
-- ============================================

INSERT INTO games (id, event_id, type, stake_teeth_int, start_hole, end_hole, status)
VALUES (uuid_generate_v4(), v_event_id, 'match_play', 10, 1, 18, 'active')
RETURNING id INTO v_game_id;

INSERT INTO game_participants (game_id, user_id) VALUES
  (v_game_id, v_owner_id),
  (v_game_id, v_admin_id);

-- ============================================
-- SAMPLE PRESS
-- ============================================

INSERT INTO games (id, event_id, type, stake_teeth_int, parent_game_id, start_hole, end_hole, status)
VALUES (uuid_generate_v4(), v_event_id, 'match_play', 10, v_game_id, 10, 18, 'active')
RETURNING id INTO v_press_id;

INSERT INTO game_participants (game_id, user_id) VALUES
  (v_press_id, v_owner_id),
  (v_press_id, v_admin_id);

-- ============================================
-- TEETH BALANCES
-- ============================================

INSERT INTO teeth_balances (event_id, user_id, balance_int) VALUES
  (v_event_id, v_owner_id, 100),
  (v_event_id, v_admin_id, 100),
  (v_event_id, v_player1_id, 100),
  (v_event_id, v_player2_id, 100);

-- Initial ledger entries
INSERT INTO teeth_ledger (event_id, user_id, delta_int, balance_int, reason, reference_type) VALUES
  (v_event_id, v_owner_id, 100, 100, 'Initial balance', 'initial'),
  (v_event_id, v_admin_id, 100, 100, 'Initial balance', 'initial'),
  (v_event_id, v_player1_id, 100, 100, 'Initial balance', 'initial'),
  (v_event_id, v_player2_id, 100, 100, 'Initial balance', 'initial');

-- ============================================
-- CHAT THREAD
-- ============================================

INSERT INTO event_threads (id, event_id, name)
VALUES (uuid_generate_v4(), v_event_id, 'General')
RETURNING id INTO v_thread_id;

-- Sample messages
INSERT INTO event_messages (thread_id, author_id, content, is_system) VALUES
  (v_thread_id, NULL, 'Welcome to Spring Classic 2024!', TRUE),
  (v_thread_id, v_owner_id, 'Looking forward to a great round today!', FALSE),
  (v_thread_id, v_admin_id, 'Weather looks perfect', FALSE);

-- ============================================
-- SAMPLE FEED POSTS
-- ============================================

INSERT INTO event_posts (event_id, author_id, content, is_system) VALUES
  (v_event_id, NULL, 'Event created: Spring Classic 2024', TRUE),
  (v_event_id, v_owner_id, 'First tee time is 8:00 AM. See everyone there!', FALSE),
  (v_event_id, NULL, 'Press created starting hole 10 (10 Teeth)', TRUE);

-- ============================================
-- SHARE LINK
-- ============================================

INSERT INTO share_links (event_id, token, created_by)
VALUES (v_event_id, 'demo-share-token-2024', v_owner_id);

END $$;

-- ============================================
-- OUTPUT
-- ============================================
-- Note: To use this seed with real users:
-- 1. Create users via Supabase Auth with emails:
--    - owner@demo.press
--    - admin@demo.press
--    - player1@demo.press
--    - player2@demo.press
-- 2. Update the UUID placeholders above with actual user IDs
-- 3. Re-run: supabase db seed

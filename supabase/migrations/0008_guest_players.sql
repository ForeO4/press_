-- Press! Guest Players
-- Migration: 0008_guest_players.sql
-- Allows adding players to events without requiring a Supabase account

-- ============================================
-- GUEST PLAYERS TABLE
-- ============================================

CREATE TABLE event_guest_players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  handicap_index DECIMAL(3,1),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Index for event lookup
CREATE INDEX idx_guest_players_event ON event_guest_players(event_id);

-- ============================================
-- UPDATE GAME PARTICIPANTS
-- ============================================

-- Add guest_player_id column (nullable)
ALTER TABLE game_participants
ADD COLUMN guest_player_id UUID REFERENCES event_guest_players(id) ON DELETE CASCADE;

-- Add constraint: must have either user_id OR guest_player_id (not both, not neither)
ALTER TABLE game_participants
ADD CONSTRAINT chk_participant_type
CHECK (
  (user_id IS NOT NULL AND guest_player_id IS NULL) OR
  (user_id IS NULL AND guest_player_id IS NOT NULL)
);

-- Make user_id nullable (was NOT NULL before)
ALTER TABLE game_participants ALTER COLUMN user_id DROP NOT NULL;

-- ============================================
-- RLS POLICIES FOR GUEST PLAYERS
-- ============================================

ALTER TABLE event_guest_players ENABLE ROW LEVEL SECURITY;

-- Event members can see guest players
CREATE POLICY "guest_players_select" ON event_guest_players
  FOR SELECT
  USING (is_event_member(event_id));

-- Admin or owner can create guest players
CREATE POLICY "guest_players_insert" ON event_guest_players
  FOR INSERT
  WITH CHECK (is_event_member(event_id, 'PLAYER'));

-- Admin or owner can update guest players
CREATE POLICY "guest_players_update" ON event_guest_players
  FOR UPDATE
  USING (is_event_member(event_id, 'ADMIN'));

-- Admin or owner can delete guest players
CREATE POLICY "guest_players_delete" ON event_guest_players
  FOR DELETE
  USING (is_event_member(event_id, 'ADMIN'));

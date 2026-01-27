-- Press! Row Level Security Policies
-- Migration: 0002_rls.sql

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Check if user is a member of an event with minimum role
CREATE OR REPLACE FUNCTION is_event_member(
  p_event_id UUID,
  p_min_role TEXT DEFAULT 'VIEWER'
)
RETURNS BOOLEAN AS $$
DECLARE
  role_order TEXT[] := ARRAY['VIEWER', 'PLAYER', 'ADMIN', 'OWNER'];
  user_role TEXT;
  user_role_idx INT;
  min_role_idx INT;
BEGIN
  -- Get user's role in the event
  SELECT role INTO user_role
  FROM event_memberships
  WHERE event_id = p_event_id
    AND user_id = auth.uid()
    AND status = 'ACTIVE';

  -- No membership found
  IF user_role IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Compare role levels
  user_role_idx := array_position(role_order, user_role);
  min_role_idx := array_position(role_order, p_min_role);

  RETURN user_role_idx >= min_role_idx;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Check if user is owner of an event
CREATE OR REPLACE FUNCTION is_event_owner(p_event_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM events
    WHERE id = p_event_id
    AND created_by = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================
-- ENABLE RLS ON ALL TABLES
-- ============================================

ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE tee_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE holes ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_tee_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE handicap_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE handicap_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE hole_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE settlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE settlement_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE teeth_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE teeth_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE calcutta_pools ENABLE ROW LEVEL SECURITY;
ALTER TABLE calcutta_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE calcutta_bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE calcutta_ownership_splits ENABLE ROW LEVEL SECURITY;
ALTER TABLE calcutta_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_objects ENABLE ROW LEVEL SECURITY;
ALTER TABLE share_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- ============================================
-- EVENTS POLICIES
-- ============================================

-- SELECT: Members can see their events, public events visible to all
CREATE POLICY "events_select" ON events
  FOR SELECT
  USING (
    is_event_member(id)
    OR visibility = 'PUBLIC'
  );

-- INSERT: Any authenticated user can create events
CREATE POLICY "events_insert" ON events
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- UPDATE: Admin or owner can update
CREATE POLICY "events_update" ON events
  FOR UPDATE
  USING (is_event_member(id, 'ADMIN'));

-- DELETE: Only owner can delete
CREATE POLICY "events_delete" ON events
  FOR DELETE
  USING (is_event_owner(id));

-- ============================================
-- EVENT MEMBERSHIPS POLICIES
-- ============================================

-- SELECT: Event members can see all memberships
CREATE POLICY "memberships_select" ON event_memberships
  FOR SELECT
  USING (is_event_member(event_id));

-- INSERT: Admin or owner can add members
CREATE POLICY "memberships_insert" ON event_memberships
  FOR INSERT
  WITH CHECK (is_event_member(event_id, 'ADMIN'));

-- UPDATE: Admin or owner can update
CREATE POLICY "memberships_update" ON event_memberships
  FOR UPDATE
  USING (is_event_member(event_id, 'ADMIN'));

-- DELETE: Admin or owner can remove
CREATE POLICY "memberships_delete" ON event_memberships
  FOR DELETE
  USING (is_event_member(event_id, 'ADMIN'));

-- ============================================
-- EVENT SETTINGS POLICIES
-- ============================================

-- SELECT: Event members can see settings
CREATE POLICY "settings_select" ON event_settings
  FOR SELECT
  USING (is_event_member(event_id));

-- INSERT: Only event owner
CREATE POLICY "settings_insert" ON event_settings
  FOR INSERT
  WITH CHECK (is_event_owner(event_id));

-- UPDATE: Admin or owner
CREATE POLICY "settings_update" ON event_settings
  FOR UPDATE
  USING (is_event_member(event_id, 'ADMIN'));

-- ============================================
-- COURSES POLICIES (Reference data - read by all authenticated)
-- ============================================

CREATE POLICY "courses_select" ON courses
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "tee_sets_select" ON tee_sets
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "holes_select" ON holes
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- ============================================
-- EVENT TEE SNAPSHOTS POLICIES
-- ============================================

CREATE POLICY "tee_snapshots_select" ON event_tee_snapshots
  FOR SELECT
  USING (is_event_member(event_id));

CREATE POLICY "tee_snapshots_insert" ON event_tee_snapshots
  FOR INSERT
  WITH CHECK (is_event_member(event_id, 'ADMIN'));

-- ============================================
-- HANDICAP POLICIES
-- ============================================

-- Users can see and edit their own handicap profile
CREATE POLICY "handicap_profiles_select" ON handicap_profiles
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "handicap_profiles_insert" ON handicap_profiles
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "handicap_profiles_update" ON handicap_profiles
  FOR UPDATE
  USING (user_id = auth.uid());

-- Handicap snapshots: event members can see
CREATE POLICY "handicap_snapshots_select" ON handicap_snapshots
  FOR SELECT
  USING (is_event_member(event_id));

CREATE POLICY "handicap_snapshots_insert" ON handicap_snapshots
  FOR INSERT
  WITH CHECK (is_event_member(event_id, 'ADMIN'));

-- ============================================
-- ROUNDS & SCORES POLICIES
-- ============================================

-- Rounds: event members can see
CREATE POLICY "rounds_select" ON rounds
  FOR SELECT
  USING (is_event_member(event_id));

-- Only user can create their own round
CREATE POLICY "rounds_insert" ON rounds
  FOR INSERT
  WITH CHECK (
    is_event_member(event_id, 'PLAYER')
    AND user_id = auth.uid()
  );

-- Scores: event members can see
CREATE POLICY "scores_select" ON hole_scores
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM rounds r
      WHERE r.id = hole_scores.round_id
      AND is_event_member(r.event_id)
    )
  );

-- Only round owner can insert scores
CREATE POLICY "scores_insert" ON hole_scores
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM rounds r
      WHERE r.id = hole_scores.round_id
      AND r.user_id = auth.uid()
    )
  );

-- Round owner can update their scores
CREATE POLICY "scores_update" ON hole_scores
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM rounds r
      WHERE r.id = hole_scores.round_id
      AND r.user_id = auth.uid()
    )
  );

-- ============================================
-- GAMES POLICIES
-- ============================================

-- Event members can see games
CREATE POLICY "games_select" ON games
  FOR SELECT
  USING (is_event_member(event_id));

-- Admin or owner can create games
CREATE POLICY "games_insert" ON games
  FOR INSERT
  WITH CHECK (is_event_member(event_id, 'ADMIN'));

-- Admin or owner can update games
CREATE POLICY "games_update" ON games
  FOR UPDATE
  USING (is_event_member(event_id, 'ADMIN'));

-- Admin or owner can delete games
CREATE POLICY "games_delete" ON games
  FOR DELETE
  USING (is_event_member(event_id, 'ADMIN'));

-- Game participants: event members can see
CREATE POLICY "game_participants_select" ON game_participants
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM games g
      WHERE g.id = game_participants.game_id
      AND is_event_member(g.event_id)
    )
  );

-- Admin can manage participants
CREATE POLICY "game_participants_insert" ON game_participants
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM games g
      WHERE g.id = game_participants.game_id
      AND is_event_member(g.event_id, 'ADMIN')
    )
  );

-- ============================================
-- SETTLEMENTS POLICIES
-- ============================================

-- Event members can see settlements
CREATE POLICY "settlements_select" ON settlements
  FOR SELECT
  USING (is_event_member(event_id));

-- Only via RPC (admin computed)
CREATE POLICY "settlements_insert" ON settlements
  FOR INSERT
  WITH CHECK (is_event_member(event_id, 'ADMIN'));

-- Settlement snapshots: admin can see
CREATE POLICY "settlement_snapshots_select" ON settlement_snapshots
  FOR SELECT
  USING (is_event_member(event_id, 'ADMIN'));

-- ============================================
-- TEETH POLICIES (Strict - mostly via RPC)
-- ============================================

-- Users can only see their own balance
CREATE POLICY "teeth_balance_select" ON teeth_balances
  FOR SELECT
  USING (user_id = auth.uid());

-- Users can only see their own ledger
CREATE POLICY "teeth_ledger_select" ON teeth_ledger
  FOR SELECT
  USING (user_id = auth.uid());

-- No direct insert/update - all via RPC with service role

-- ============================================
-- CALCUTTA POLICIES
-- ============================================

-- Event members can see pools
CREATE POLICY "calcutta_pools_select" ON calcutta_pools
  FOR SELECT
  USING (is_event_member(event_id));

CREATE POLICY "calcutta_pools_insert" ON calcutta_pools
  FOR INSERT
  WITH CHECK (is_event_member(event_id, 'ADMIN'));

-- Items
CREATE POLICY "calcutta_items_select" ON calcutta_items
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM calcutta_pools p
      WHERE p.id = calcutta_items.pool_id
      AND is_event_member(p.event_id)
    )
  );

CREATE POLICY "calcutta_items_insert" ON calcutta_items
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM calcutta_pools p
      WHERE p.id = calcutta_items.pool_id
      AND is_event_member(p.event_id, 'ADMIN')
    )
  );

-- Bids
CREATE POLICY "calcutta_bids_select" ON calcutta_bids
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM calcutta_items i
      JOIN calcutta_pools p ON p.id = i.pool_id
      WHERE i.id = calcutta_bids.item_id
      AND is_event_member(p.event_id)
    )
  );

-- Ownership splits
CREATE POLICY "calcutta_splits_select" ON calcutta_ownership_splits
  FOR SELECT
  USING (user_id = auth.uid());

-- Payouts
CREATE POLICY "calcutta_payouts_select" ON calcutta_payouts
  FOR SELECT
  USING (bidder_id = auth.uid());

-- ============================================
-- SOCIAL POLICIES
-- ============================================

-- Posts: event members can see
CREATE POLICY "posts_select" ON event_posts
  FOR SELECT
  USING (is_event_member(event_id));

-- Players can create posts
CREATE POLICY "posts_insert" ON event_posts
  FOR INSERT
  WITH CHECK (
    is_event_member(event_id, 'PLAYER')
    AND (author_id = auth.uid() OR author_id IS NULL)
  );

-- Author can update their posts
CREATE POLICY "posts_update" ON event_posts
  FOR UPDATE
  USING (author_id = auth.uid());

-- Author or admin can delete
CREATE POLICY "posts_delete" ON event_posts
  FOR DELETE
  USING (
    author_id = auth.uid()
    OR is_event_member(event_id, 'ADMIN')
  );

-- Comments: similar to posts
CREATE POLICY "comments_select" ON event_comments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM event_posts p
      WHERE p.id = event_comments.post_id
      AND is_event_member(p.event_id)
    )
  );

CREATE POLICY "comments_insert" ON event_comments
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM event_posts p
      WHERE p.id = event_comments.post_id
      AND is_event_member(p.event_id, 'PLAYER')
    )
    AND author_id = auth.uid()
  );

-- Reactions
CREATE POLICY "reactions_select" ON event_reactions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM event_posts p
      WHERE p.id = event_reactions.post_id
      AND is_event_member(p.event_id)
    )
  );

CREATE POLICY "reactions_insert" ON event_reactions
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM event_posts p
      WHERE p.id = event_reactions.post_id
      AND is_event_member(p.event_id, 'PLAYER')
    )
    AND user_id = auth.uid()
  );

CREATE POLICY "reactions_delete" ON event_reactions
  FOR DELETE
  USING (user_id = auth.uid());

-- Threads
CREATE POLICY "threads_select" ON event_threads
  FOR SELECT
  USING (is_event_member(event_id));

CREATE POLICY "threads_insert" ON event_threads
  FOR INSERT
  WITH CHECK (is_event_member(event_id, 'ADMIN'));

-- Messages
CREATE POLICY "messages_select" ON event_messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM event_threads t
      WHERE t.id = event_messages.thread_id
      AND is_event_member(t.event_id)
    )
  );

CREATE POLICY "messages_insert" ON event_messages
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM event_threads t
      WHERE t.id = event_messages.thread_id
      AND is_event_member(t.event_id, 'PLAYER')
    )
    AND (author_id = auth.uid() OR author_id IS NULL)
  );

-- ============================================
-- MEDIA POLICIES
-- ============================================

CREATE POLICY "media_select" ON media_objects
  FOR SELECT
  USING (is_event_member(event_id));

CREATE POLICY "media_insert" ON media_objects
  FOR INSERT
  WITH CHECK (
    is_event_member(event_id, 'PLAYER')
    AND uploaded_by = auth.uid()
  );

-- ============================================
-- SHARE LINKS POLICIES
-- ============================================

CREATE POLICY "share_links_select" ON share_links
  FOR SELECT
  USING (is_event_member(event_id, 'ADMIN'));

CREATE POLICY "share_links_insert" ON share_links
  FOR INSERT
  WITH CHECK (is_event_member(event_id, 'ADMIN'));

CREATE POLICY "share_links_delete" ON share_links
  FOR DELETE
  USING (is_event_member(event_id, 'ADMIN'));

-- ============================================
-- AUDIT LOG POLICIES
-- ============================================

-- Only admin can see audit log
CREATE POLICY "audit_log_select" ON audit_log
  FOR SELECT
  USING (
    event_id IS NULL OR is_event_member(event_id, 'ADMIN')
  );

-- Insert via RPC only (system)

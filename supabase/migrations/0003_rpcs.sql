-- Press! RPC Functions
-- Migration: 0003_rpcs.sql
-- Server-side functions for secure operations

-- ============================================
-- EVENT LOCK FUNCTIONS
-- ============================================

-- Lock an event (prevents score changes)
CREATE OR REPLACE FUNCTION rpc_lock_event(p_event_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_event events%ROWTYPE;
BEGIN
  -- Check permissions
  IF NOT is_event_member(p_event_id, 'ADMIN') THEN
    RAISE EXCEPTION 'Forbidden: Must be admin to lock event';
  END IF;

  -- Update event
  UPDATE events
  SET is_locked = TRUE, updated_at = NOW()
  WHERE id = p_event_id
  RETURNING * INTO v_event;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Event not found';
  END IF;

  -- Audit log
  INSERT INTO audit_log (event_id, user_id, action, entity_type, entity_id, new_values)
  VALUES (p_event_id, auth.uid(), 'lock_event', 'event', p_event_id, '{"is_locked": true}'::jsonb);

  RETURN jsonb_build_object('success', true, 'event_id', p_event_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Unlock an event
CREATE OR REPLACE FUNCTION rpc_unlock_event(p_event_id UUID, p_reason TEXT DEFAULT NULL)
RETURNS JSONB AS $$
DECLARE
  v_event events%ROWTYPE;
BEGIN
  -- Check permissions
  IF NOT is_event_member(p_event_id, 'ADMIN') THEN
    RAISE EXCEPTION 'Forbidden: Must be admin to unlock event';
  END IF;

  -- Update event
  UPDATE events
  SET is_locked = FALSE, updated_at = NOW()
  WHERE id = p_event_id
  RETURNING * INTO v_event;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Event not found';
  END IF;

  -- Audit log
  INSERT INTO audit_log (event_id, user_id, action, entity_type, entity_id, new_values)
  VALUES (
    p_event_id,
    auth.uid(),
    'unlock_event',
    'event',
    p_event_id,
    jsonb_build_object('is_locked', false, 'reason', p_reason)
  );

  RETURN jsonb_build_object('success', true, 'event_id', p_event_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- SCORE FUNCTIONS
-- ============================================

-- Upsert a hole score
CREATE OR REPLACE FUNCTION rpc_upsert_score(
  p_event_id UUID,
  p_round_id UUID,
  p_user_id UUID,
  p_hole_number INTEGER,
  p_strokes_int INTEGER
)
RETURNS JSONB AS $$
DECLARE
  v_event events%ROWTYPE;
  v_round rounds%ROWTYPE;
  v_score hole_scores%ROWTYPE;
  v_is_admin BOOLEAN;
BEGIN
  -- Check event exists and not locked
  SELECT * INTO v_event FROM events WHERE id = p_event_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Event not found';
  END IF;

  IF v_event.is_locked THEN
    RAISE EXCEPTION 'Event is locked';
  END IF;

  -- Check round exists and belongs to event
  SELECT * INTO v_round FROM rounds WHERE id = p_round_id AND event_id = p_event_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Round not found';
  END IF;

  -- Check permissions
  v_is_admin := is_event_member(p_event_id, 'ADMIN');
  IF NOT v_is_admin AND v_round.user_id != auth.uid() THEN
    RAISE EXCEPTION 'Forbidden: Can only update own scores';
  END IF;

  -- Validate hole number
  IF p_hole_number < 1 OR p_hole_number > 18 THEN
    RAISE EXCEPTION 'Invalid hole number';
  END IF;

  -- Validate strokes
  IF p_strokes_int < 0 THEN
    RAISE EXCEPTION 'Strokes must be non-negative';
  END IF;

  -- Upsert score
  INSERT INTO hole_scores (round_id, hole_number, strokes)
  VALUES (p_round_id, p_hole_number, p_strokes_int)
  ON CONFLICT (round_id, hole_number)
  DO UPDATE SET strokes = p_strokes_int, updated_at = NOW()
  RETURNING * INTO v_score;

  -- Audit log
  INSERT INTO audit_log (event_id, user_id, action, entity_type, entity_id, new_values)
  VALUES (
    p_event_id,
    auth.uid(),
    'upsert_score',
    'hole_score',
    v_score.id,
    jsonb_build_object('hole', p_hole_number, 'strokes', p_strokes_int)
  );

  RETURN jsonb_build_object(
    'success', true,
    'score', row_to_json(v_score)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- PRESS FUNCTIONS
-- ============================================

-- Create a press (child game)
CREATE OR REPLACE FUNCTION rpc_create_press(
  p_parent_game_id UUID,
  p_start_hole INTEGER,
  p_stake_teeth_int INTEGER
)
RETURNS JSONB AS $$
DECLARE
  v_parent_game games%ROWTYPE;
  v_event events%ROWTYPE;
  v_settings event_settings%ROWTYPE;
  v_new_game games%ROWTYPE;
  v_can_press BOOLEAN;
BEGIN
  -- Get parent game
  SELECT * INTO v_parent_game FROM games WHERE id = p_parent_game_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Parent game not found';
  END IF;

  -- Get event
  SELECT * INTO v_event FROM events WHERE id = v_parent_game.event_id;
  IF v_event.is_locked THEN
    RAISE EXCEPTION 'Event is locked';
  END IF;

  -- Get settings
  SELECT * INTO v_settings FROM event_settings WHERE event_id = v_parent_game.event_id;

  -- Check permissions
  v_can_press := is_event_member(v_parent_game.event_id, 'ADMIN');
  IF NOT v_can_press AND v_settings.allow_self_press THEN
    -- Check if user is a participant
    v_can_press := EXISTS (
      SELECT 1 FROM game_participants
      WHERE game_id = p_parent_game_id
      AND user_id = auth.uid()
    );
  END IF;

  IF NOT v_can_press THEN
    RAISE EXCEPTION 'Forbidden: Cannot create press';
  END IF;

  -- Validate start hole
  IF p_start_hole < 1 OR p_start_hole > 18 THEN
    RAISE EXCEPTION 'Invalid start hole';
  END IF;

  IF p_start_hole > v_parent_game.end_hole THEN
    RAISE EXCEPTION 'Press cannot start after parent game ends';
  END IF;

  -- Validate stake (must be positive integer)
  IF p_stake_teeth_int <= 0 THEN
    RAISE EXCEPTION 'Stake must be positive';
  END IF;

  -- Create press
  INSERT INTO games (
    event_id,
    type,
    stake_teeth_int,
    parent_game_id,
    start_hole,
    end_hole,
    status
  ) VALUES (
    v_parent_game.event_id,
    v_parent_game.type,
    p_stake_teeth_int,
    p_parent_game_id,
    p_start_hole,
    v_parent_game.end_hole,
    'active'
  ) RETURNING * INTO v_new_game;

  -- Copy participants from parent
  INSERT INTO game_participants (game_id, user_id, team_id)
  SELECT v_new_game.id, user_id, team_id
  FROM game_participants
  WHERE game_id = p_parent_game_id;

  -- Audit log
  INSERT INTO audit_log (event_id, user_id, action, entity_type, entity_id, new_values)
  VALUES (
    v_parent_game.event_id,
    auth.uid(),
    'create_press',
    'game',
    v_new_game.id,
    jsonb_build_object(
      'parent_game_id', p_parent_game_id,
      'start_hole', p_start_hole,
      'stake', p_stake_teeth_int
    )
  );

  -- Create system post
  INSERT INTO event_posts (event_id, content, is_system)
  VALUES (
    v_parent_game.event_id,
    'Press created starting hole ' || p_start_hole || ' (' || p_stake_teeth_int || ' Teeth)',
    TRUE
  );

  RETURN jsonb_build_object(
    'success', true,
    'press', row_to_json(v_new_game)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- SETTLEMENT FUNCTIONS
-- ============================================

-- Compute settlement for an event
CREATE OR REPLACE FUNCTION rpc_compute_settlement(p_event_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_game RECORD;
  v_settlements JSONB := '[]'::jsonb;
  v_snapshot_id UUID;
BEGIN
  -- Check permissions
  IF NOT is_event_member(p_event_id, 'ADMIN') THEN
    RAISE EXCEPTION 'Forbidden: Must be admin to compute settlement';
  END IF;

  -- Clear existing settlements for this event
  DELETE FROM settlements WHERE event_id = p_event_id;

  -- Process each game
  -- Note: In production, this would have actual settlement logic
  -- For now, we create a placeholder structure
  FOR v_game IN
    SELECT * FROM games
    WHERE event_id = p_event_id
    AND status = 'complete'
  LOOP
    -- Settlement calculation would go here
    -- This is a placeholder that needs actual game result logic
    NULL;
  END LOOP;

  -- Create snapshot
  INSERT INTO settlement_snapshots (event_id, data)
  VALUES (p_event_id, v_settlements)
  RETURNING id INTO v_snapshot_id;

  -- Audit log
  INSERT INTO audit_log (event_id, user_id, action, entity_type, entity_id)
  VALUES (p_event_id, auth.uid(), 'compute_settlement', 'event', p_event_id);

  RETURN jsonb_build_object(
    'success', true,
    'snapshot_id', v_snapshot_id,
    'settlements', v_settlements
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- TEETH FUNCTIONS
-- ============================================

-- Grant Alligator Teeth to a user
CREATE OR REPLACE FUNCTION rpc_grant_teeth(
  p_event_id UUID,
  p_user_id UUID,
  p_delta_int INTEGER,
  p_reason TEXT
)
RETURNS JSONB AS $$
DECLARE
  v_current_balance INTEGER;
  v_new_balance INTEGER;
  v_balance_row teeth_balances%ROWTYPE;
BEGIN
  -- Check permissions (admin only for manual grants)
  IF NOT is_event_member(p_event_id, 'ADMIN') THEN
    RAISE EXCEPTION 'Forbidden: Must be admin to grant teeth';
  END IF;

  -- Validate delta is integer (should always be true in PG, but explicit check)
  IF p_delta_int != FLOOR(p_delta_int) THEN
    RAISE EXCEPTION 'Teeth amount must be an integer';
  END IF;

  -- Get or create balance
  SELECT balance_int INTO v_current_balance
  FROM teeth_balances
  WHERE event_id = p_event_id AND user_id = p_user_id;

  IF NOT FOUND THEN
    v_current_balance := 0;
  END IF;

  -- Calculate new balance (floor at 0)
  v_new_balance := GREATEST(0, v_current_balance + p_delta_int);

  -- Upsert balance
  INSERT INTO teeth_balances (event_id, user_id, balance_int)
  VALUES (p_event_id, p_user_id, v_new_balance)
  ON CONFLICT (event_id, user_id)
  DO UPDATE SET balance_int = v_new_balance, updated_at = NOW()
  RETURNING * INTO v_balance_row;

  -- Insert ledger entry
  INSERT INTO teeth_ledger (event_id, user_id, delta_int, balance_int, reason, reference_type)
  VALUES (p_event_id, p_user_id, p_delta_int, v_new_balance, p_reason, 'admin');

  -- Audit log
  INSERT INTO audit_log (event_id, user_id, action, entity_type, entity_id, new_values)
  VALUES (
    p_event_id,
    auth.uid(),
    'grant_teeth',
    'teeth_balance',
    v_balance_row.id,
    jsonb_build_object('delta', p_delta_int, 'new_balance', v_new_balance, 'reason', p_reason)
  );

  RETURN jsonb_build_object(
    'success', true,
    'user_id', p_user_id,
    'delta', p_delta_int,
    'new_balance', v_new_balance
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Initialize teeth balance for new member
CREATE OR REPLACE FUNCTION rpc_initialize_teeth(
  p_event_id UUID,
  p_user_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_default_teeth INTEGER;
  v_balance_row teeth_balances%ROWTYPE;
BEGIN
  -- Get default teeth from settings
  SELECT default_teeth INTO v_default_teeth
  FROM event_settings
  WHERE event_id = p_event_id;

  IF NOT FOUND THEN
    v_default_teeth := 100; -- Fallback default
  END IF;

  -- Create balance if not exists
  INSERT INTO teeth_balances (event_id, user_id, balance_int)
  VALUES (p_event_id, p_user_id, v_default_teeth)
  ON CONFLICT (event_id, user_id) DO NOTHING
  RETURNING * INTO v_balance_row;

  IF v_balance_row.id IS NOT NULL THEN
    -- New balance created, add ledger entry
    INSERT INTO teeth_ledger (event_id, user_id, delta_int, balance_int, reason, reference_type)
    VALUES (p_event_id, p_user_id, v_default_teeth, v_default_teeth, 'Initial balance', 'initial');
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'user_id', p_user_id,
    'balance', v_default_teeth
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- CALCUTTA FUNCTIONS
-- ============================================

-- Create calcutta pool
CREATE OR REPLACE FUNCTION rpc_create_calcutta_pool(
  p_event_id UUID,
  p_name TEXT,
  p_mode TEXT,
  p_schema JSONB,
  p_house_cut INTEGER
)
RETURNS JSONB AS $$
DECLARE
  v_pool calcutta_pools%ROWTYPE;
BEGIN
  -- Check permissions
  IF NOT is_event_member(p_event_id, 'ADMIN') THEN
    RAISE EXCEPTION 'Forbidden: Must be admin to create calcutta pool';
  END IF;

  -- Validate mode
  IF p_mode NOT IN ('individual', 'team') THEN
    RAISE EXCEPTION 'Invalid mode';
  END IF;

  -- Validate house cut
  IF p_house_cut < 0 OR p_house_cut > 100 THEN
    RAISE EXCEPTION 'House cut must be 0-100';
  END IF;

  -- Create pool
  INSERT INTO calcutta_pools (event_id, name, mode, payout_schema, house_cut)
  VALUES (p_event_id, p_name, p_mode, p_schema, p_house_cut)
  RETURNING * INTO v_pool;

  RETURN jsonb_build_object(
    'success', true,
    'pool', row_to_json(v_pool)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Settle calcutta pool
CREATE OR REPLACE FUNCTION rpc_settle_calcutta(p_pool_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_pool calcutta_pools%ROWTYPE;
  v_total_pool INTEGER;
  v_distributable INTEGER;
  v_payouts JSONB := '[]'::jsonb;
BEGIN
  -- Get pool
  SELECT * INTO v_pool FROM calcutta_pools WHERE id = p_pool_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pool not found';
  END IF;

  -- Check permissions
  IF NOT is_event_member(v_pool.event_id, 'ADMIN') THEN
    RAISE EXCEPTION 'Forbidden: Must be admin to settle calcutta';
  END IF;

  -- Calculate total pool
  SELECT COALESCE(SUM(amount_int), 0) INTO v_total_pool
  FROM calcutta_bids b
  JOIN calcutta_items i ON i.id = b.item_id
  WHERE i.pool_id = p_pool_id;

  -- Calculate distributable (after house cut)
  v_distributable := v_total_pool - (v_total_pool * v_pool.house_cut / 100);

  -- Note: Full payout calculation would go here based on payout_schema
  -- This is a placeholder structure

  -- Update pool status
  UPDATE calcutta_pools
  SET status = 'complete'
  WHERE id = p_pool_id;

  RETURN jsonb_build_object(
    'success', true,
    'pool_id', p_pool_id,
    'total_pool', v_total_pool,
    'distributable', v_distributable,
    'payouts', v_payouts
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- EVENT CREATION HELPER
-- ============================================

-- Create event with owner membership and settings
CREATE OR REPLACE FUNCTION rpc_create_event(
  p_name TEXT,
  p_date DATE,
  p_visibility TEXT DEFAULT 'PRIVATE'
)
RETURNS JSONB AS $$
DECLARE
  v_event events%ROWTYPE;
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Must be authenticated';
  END IF;

  -- Create event
  INSERT INTO events (name, date, visibility, created_by)
  VALUES (p_name, p_date, p_visibility, v_user_id)
  RETURNING * INTO v_event;

  -- Create owner membership
  INSERT INTO event_memberships (event_id, user_id, role, status)
  VALUES (v_event.id, v_user_id, 'OWNER', 'ACTIVE');

  -- Create default settings
  INSERT INTO event_settings (event_id)
  VALUES (v_event.id);

  -- Create default chat thread
  INSERT INTO event_threads (event_id, name)
  VALUES (v_event.id, 'General');

  -- Initialize teeth balance for owner
  PERFORM rpc_initialize_teeth(v_event.id, v_user_id);

  RETURN jsonb_build_object(
    'success', true,
    'event', row_to_json(v_event)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

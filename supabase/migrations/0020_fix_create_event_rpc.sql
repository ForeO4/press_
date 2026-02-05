-- Fix rpc_create_event to accept new event fields
-- Migration: 0020_fix_create_event_rpc.sql
--
-- The frontend passes end_date, num_rounds, num_holes to this RPC
-- but the function was never updated to accept these parameters.
-- This caused event creation to fail or omit these values.

CREATE OR REPLACE FUNCTION rpc_create_event(
  p_name TEXT,
  p_date DATE,
  p_visibility TEXT DEFAULT 'PRIVATE',
  p_end_date DATE DEFAULT NULL,
  p_num_rounds INTEGER DEFAULT 1,
  p_num_holes INTEGER DEFAULT 18
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

  -- Create event with all fields
  INSERT INTO events (name, date, visibility, created_by, end_date, num_rounds, num_holes)
  VALUES (p_name, p_date, p_visibility, v_user_id, p_end_date, p_num_rounds, p_num_holes)
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

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION rpc_create_event(TEXT, DATE, TEXT, DATE, INTEGER, INTEGER) TO authenticated;

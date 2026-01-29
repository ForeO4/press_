-- Press! Clubhouses
-- Migration: 0015_clubhouses.sql
-- New Clubhouse entity that can contain Events

-- ============================================
-- CLUBHOUSES: Core Tables
-- ============================================

-- Clubhouses table
CREATE TABLE clubhouses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL DEFAULT 'trip' CHECK (type IN ('trip', 'league', 'event', 'social')),
  privacy TEXT NOT NULL DEFAULT 'private' CHECK (privacy IN ('private', 'public')),
  invite_code TEXT NOT NULL UNIQUE,
  invite_code_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  theme TEXT DEFAULT 'dark' CHECK (theme IN ('dark', 'light', 'masters', 'links', 'ryder')),
  logo_url TEXT,
  banner_url TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE clubhouses IS 'Clubhouses are persistent groups that can host multiple events';
COMMENT ON COLUMN clubhouses.type IS 'trip=golf trip, league=recurring league, event=single event group, social=social club';
COMMENT ON COLUMN clubhouses.privacy IS 'private=invite only, public=discoverable';
COMMENT ON COLUMN clubhouses.invite_code IS '6-character alphanumeric code for joining';

-- Clubhouse memberships table
CREATE TABLE clubhouse_memberships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clubhouse_id UUID NOT NULL REFERENCES clubhouses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'MEMBER' CHECK (role IN ('OWNER', 'ADMIN', 'MEMBER')),
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('PENDING', 'ACTIVE', 'REMOVED')),
  nickname TEXT,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (clubhouse_id, user_id)
);

COMMENT ON TABLE clubhouse_memberships IS 'User memberships in clubhouses';
COMMENT ON COLUMN clubhouse_memberships.role IS 'OWNER=full control, ADMIN=manage members+events, MEMBER=participate';
COMMENT ON COLUMN clubhouse_memberships.nickname IS 'Optional display name within this clubhouse';

-- Add clubhouse_id to existing events table
ALTER TABLE events ADD COLUMN IF NOT EXISTS clubhouse_id UUID REFERENCES clubhouses(id) ON DELETE SET NULL;
COMMENT ON COLUMN events.clubhouse_id IS 'Optional link to parent clubhouse (NULL = standalone event)';

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_clubhouses_invite_code ON clubhouses(invite_code);
CREATE INDEX idx_clubhouses_created_by ON clubhouses(created_by);
CREATE INDEX idx_clubhouse_memberships_clubhouse ON clubhouse_memberships(clubhouse_id);
CREATE INDEX idx_clubhouse_memberships_user ON clubhouse_memberships(user_id);
CREATE INDEX idx_events_clubhouse ON events(clubhouse_id);

-- ============================================
-- TRIGGERS
-- ============================================

CREATE TRIGGER clubhouses_updated_at BEFORE UPDATE ON clubhouses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER clubhouse_memberships_updated_at BEFORE UPDATE ON clubhouse_memberships
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Generate a random 6-character alphanumeric invite code
CREATE OR REPLACE FUNCTION generate_invite_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- Omit confusing chars: 0, O, I, 1
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..6 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Check if user is a clubhouse member with minimum role
CREATE OR REPLACE FUNCTION is_clubhouse_member(p_clubhouse_id UUID, p_min_role TEXT DEFAULT 'MEMBER')
RETURNS BOOLEAN AS $$
DECLARE
  v_user_id UUID;
  v_role TEXT;
  v_roles TEXT[] := ARRAY['MEMBER', 'ADMIN', 'OWNER'];
  v_min_role_idx INTEGER;
  v_user_role_idx INTEGER;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN FALSE;
  END IF;

  SELECT role INTO v_role
  FROM clubhouse_memberships
  WHERE clubhouse_id = p_clubhouse_id
    AND user_id = v_user_id
    AND status = 'ACTIVE';

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  -- Find role indexes (higher = more permissions)
  v_min_role_idx := array_position(v_roles, p_min_role);
  v_user_role_idx := array_position(v_roles, v_role);

  RETURN v_user_role_idx >= v_min_role_idx;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- RPC FUNCTIONS
-- ============================================

-- Create a new clubhouse with owner membership
CREATE OR REPLACE FUNCTION rpc_create_clubhouse(
  p_name TEXT,
  p_description TEXT DEFAULT NULL,
  p_type TEXT DEFAULT 'trip',
  p_privacy TEXT DEFAULT 'private'
)
RETURNS JSONB AS $$
DECLARE
  v_clubhouse clubhouses%ROWTYPE;
  v_user_id UUID;
  v_invite_code TEXT;
  v_attempts INTEGER := 0;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Must be authenticated';
  END IF;

  -- Validate type
  IF p_type NOT IN ('trip', 'league', 'event', 'social') THEN
    RAISE EXCEPTION 'Invalid clubhouse type';
  END IF;

  -- Validate privacy
  IF p_privacy NOT IN ('private', 'public') THEN
    RAISE EXCEPTION 'Invalid privacy setting';
  END IF;

  -- Generate unique invite code (retry if collision)
  LOOP
    v_invite_code := generate_invite_code();
    EXIT WHEN NOT EXISTS (SELECT 1 FROM clubhouses WHERE invite_code = v_invite_code);
    v_attempts := v_attempts + 1;
    IF v_attempts > 10 THEN
      RAISE EXCEPTION 'Unable to generate unique invite code';
    END IF;
  END LOOP;

  -- Create clubhouse
  INSERT INTO clubhouses (name, description, type, privacy, invite_code, created_by)
  VALUES (p_name, p_description, p_type, p_privacy, v_invite_code, v_user_id)
  RETURNING * INTO v_clubhouse;

  -- Create owner membership
  INSERT INTO clubhouse_memberships (clubhouse_id, user_id, role, status, joined_at)
  VALUES (v_clubhouse.id, v_user_id, 'OWNER', 'ACTIVE', NOW());

  -- Audit log
  INSERT INTO audit_log (user_id, action, entity_type, entity_id, new_values)
  VALUES (
    v_user_id,
    'create_clubhouse',
    'clubhouse',
    v_clubhouse.id,
    jsonb_build_object('name', p_name, 'type', p_type, 'privacy', p_privacy)
  );

  RETURN jsonb_build_object(
    'success', true,
    'clubhouse', row_to_json(v_clubhouse)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Join a clubhouse by invite code
CREATE OR REPLACE FUNCTION rpc_join_clubhouse_by_code(p_invite_code TEXT)
RETURNS JSONB AS $$
DECLARE
  v_clubhouse clubhouses%ROWTYPE;
  v_user_id UUID;
  v_existing_membership clubhouse_memberships%ROWTYPE;
  v_new_membership clubhouse_memberships%ROWTYPE;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Must be authenticated';
  END IF;

  -- Normalize invite code (uppercase, trim)
  p_invite_code := UPPER(TRIM(p_invite_code));

  -- Find clubhouse by invite code
  SELECT * INTO v_clubhouse
  FROM clubhouses
  WHERE invite_code = p_invite_code
    AND invite_code_enabled = TRUE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid or expired invite code';
  END IF;

  -- Check for existing membership
  SELECT * INTO v_existing_membership
  FROM clubhouse_memberships
  WHERE clubhouse_id = v_clubhouse.id
    AND user_id = v_user_id;

  IF FOUND THEN
    IF v_existing_membership.status = 'ACTIVE' THEN
      -- Already a member, just return success
      RETURN jsonb_build_object(
        'success', true,
        'clubhouse', row_to_json(v_clubhouse),
        'already_member', true
      );
    ELSIF v_existing_membership.status = 'REMOVED' THEN
      -- Reactivate membership
      UPDATE clubhouse_memberships
      SET status = 'ACTIVE', role = 'MEMBER', joined_at = NOW(), updated_at = NOW()
      WHERE id = v_existing_membership.id
      RETURNING * INTO v_new_membership;
    ELSE
      -- Pending status, just activate
      UPDATE clubhouse_memberships
      SET status = 'ACTIVE', joined_at = NOW(), updated_at = NOW()
      WHERE id = v_existing_membership.id
      RETURNING * INTO v_new_membership;
    END IF;
  ELSE
    -- Create new membership
    INSERT INTO clubhouse_memberships (clubhouse_id, user_id, role, status, joined_at)
    VALUES (v_clubhouse.id, v_user_id, 'MEMBER', 'ACTIVE', NOW())
    RETURNING * INTO v_new_membership;
  END IF;

  -- Audit log
  INSERT INTO audit_log (user_id, action, entity_type, entity_id, new_values)
  VALUES (
    v_user_id,
    'join_clubhouse',
    'clubhouse',
    v_clubhouse.id,
    jsonb_build_object('invite_code', p_invite_code)
  );

  RETURN jsonb_build_object(
    'success', true,
    'clubhouse', row_to_json(v_clubhouse),
    'membership', row_to_json(v_new_membership)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create an event within a clubhouse
CREATE OR REPLACE FUNCTION rpc_create_clubhouse_event(
  p_clubhouse_id UUID,
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

  -- Check clubhouse membership (must be at least ADMIN to create events)
  IF NOT is_clubhouse_member(p_clubhouse_id, 'ADMIN') THEN
    RAISE EXCEPTION 'Forbidden: Must be clubhouse admin to create events';
  END IF;

  -- Create event linked to clubhouse
  INSERT INTO events (name, date, visibility, clubhouse_id, created_by)
  VALUES (p_name, p_date, p_visibility, p_clubhouse_id, v_user_id)
  RETURNING * INTO v_event;

  -- Create owner membership for the event
  INSERT INTO event_memberships (event_id, user_id, role, status)
  VALUES (v_event.id, v_user_id, 'OWNER', 'ACTIVE');

  -- Create default event settings
  INSERT INTO event_settings (event_id)
  VALUES (v_event.id);

  -- Create default chat thread
  INSERT INTO event_threads (event_id, name)
  VALUES (v_event.id, 'General');

  -- Initialize teeth balance for owner
  PERFORM rpc_initialize_teeth(v_event.id, v_user_id);

  -- Audit log
  INSERT INTO audit_log (event_id, user_id, action, entity_type, entity_id, new_values)
  VALUES (
    v_event.id,
    v_user_id,
    'create_clubhouse_event',
    'event',
    v_event.id,
    jsonb_build_object('clubhouse_id', p_clubhouse_id, 'name', p_name)
  );

  RETURN jsonb_build_object(
    'success', true,
    'event', row_to_json(v_event)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update clubhouse details
CREATE OR REPLACE FUNCTION rpc_update_clubhouse(
  p_clubhouse_id UUID,
  p_name TEXT DEFAULT NULL,
  p_description TEXT DEFAULT NULL,
  p_theme TEXT DEFAULT NULL,
  p_privacy TEXT DEFAULT NULL,
  p_invite_code_enabled BOOLEAN DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_clubhouse clubhouses%ROWTYPE;
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Must be authenticated';
  END IF;

  -- Check permissions (must be ADMIN or OWNER)
  IF NOT is_clubhouse_member(p_clubhouse_id, 'ADMIN') THEN
    RAISE EXCEPTION 'Forbidden: Must be clubhouse admin';
  END IF;

  -- Validate theme if provided
  IF p_theme IS NOT NULL AND p_theme NOT IN ('dark', 'light', 'masters', 'links', 'ryder') THEN
    RAISE EXCEPTION 'Invalid theme';
  END IF;

  -- Validate privacy if provided
  IF p_privacy IS NOT NULL AND p_privacy NOT IN ('private', 'public') THEN
    RAISE EXCEPTION 'Invalid privacy setting';
  END IF;

  -- Update clubhouse
  UPDATE clubhouses
  SET
    name = COALESCE(p_name, name),
    description = COALESCE(p_description, description),
    theme = COALESCE(p_theme, theme),
    privacy = COALESCE(p_privacy, privacy),
    invite_code_enabled = COALESCE(p_invite_code_enabled, invite_code_enabled),
    updated_at = NOW()
  WHERE id = p_clubhouse_id
  RETURNING * INTO v_clubhouse;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Clubhouse not found';
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'clubhouse', row_to_json(v_clubhouse)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Regenerate invite code
CREATE OR REPLACE FUNCTION rpc_regenerate_invite_code(p_clubhouse_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_clubhouse clubhouses%ROWTYPE;
  v_user_id UUID;
  v_new_code TEXT;
  v_attempts INTEGER := 0;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Must be authenticated';
  END IF;

  -- Check permissions (must be ADMIN or OWNER)
  IF NOT is_clubhouse_member(p_clubhouse_id, 'ADMIN') THEN
    RAISE EXCEPTION 'Forbidden: Must be clubhouse admin';
  END IF;

  -- Generate new unique invite code
  LOOP
    v_new_code := generate_invite_code();
    EXIT WHEN NOT EXISTS (SELECT 1 FROM clubhouses WHERE invite_code = v_new_code);
    v_attempts := v_attempts + 1;
    IF v_attempts > 10 THEN
      RAISE EXCEPTION 'Unable to generate unique invite code';
    END IF;
  END LOOP;

  -- Update clubhouse
  UPDATE clubhouses
  SET invite_code = v_new_code, updated_at = NOW()
  WHERE id = p_clubhouse_id
  RETURNING * INTO v_clubhouse;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Clubhouse not found';
  END IF;

  -- Audit log
  INSERT INTO audit_log (user_id, action, entity_type, entity_id, new_values)
  VALUES (
    v_user_id,
    'regenerate_invite_code',
    'clubhouse',
    p_clubhouse_id,
    jsonb_build_object('new_code', v_new_code)
  );

  RETURN jsonb_build_object(
    'success', true,
    'clubhouse', row_to_json(v_clubhouse)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update member role
CREATE OR REPLACE FUNCTION rpc_update_clubhouse_member_role(
  p_clubhouse_id UUID,
  p_user_id UUID,
  p_role TEXT
)
RETURNS JSONB AS $$
DECLARE
  v_membership clubhouse_memberships%ROWTYPE;
  v_actor_id UUID;
  v_actor_role TEXT;
BEGIN
  v_actor_id := auth.uid();
  IF v_actor_id IS NULL THEN
    RAISE EXCEPTION 'Must be authenticated';
  END IF;

  -- Cannot change own role
  IF v_actor_id = p_user_id THEN
    RAISE EXCEPTION 'Cannot change your own role';
  END IF;

  -- Validate role
  IF p_role NOT IN ('OWNER', 'ADMIN', 'MEMBER') THEN
    RAISE EXCEPTION 'Invalid role';
  END IF;

  -- Check actor permissions (must be OWNER to change roles)
  IF NOT is_clubhouse_member(p_clubhouse_id, 'OWNER') THEN
    RAISE EXCEPTION 'Forbidden: Only owners can change member roles';
  END IF;

  -- Update membership
  UPDATE clubhouse_memberships
  SET role = p_role, updated_at = NOW()
  WHERE clubhouse_id = p_clubhouse_id
    AND user_id = p_user_id
    AND status = 'ACTIVE'
  RETURNING * INTO v_membership;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Member not found';
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'membership', row_to_json(v_membership)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Remove member from clubhouse
CREATE OR REPLACE FUNCTION rpc_remove_clubhouse_member(
  p_clubhouse_id UUID,
  p_user_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_membership clubhouse_memberships%ROWTYPE;
  v_actor_id UUID;
  v_target_role TEXT;
BEGIN
  v_actor_id := auth.uid();
  IF v_actor_id IS NULL THEN
    RAISE EXCEPTION 'Must be authenticated';
  END IF;

  -- Get target's role
  SELECT role INTO v_target_role
  FROM clubhouse_memberships
  WHERE clubhouse_id = p_clubhouse_id
    AND user_id = p_user_id
    AND status = 'ACTIVE';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Member not found';
  END IF;

  -- Cannot remove owners
  IF v_target_role = 'OWNER' THEN
    RAISE EXCEPTION 'Cannot remove an owner';
  END IF;

  -- Check permissions (ADMIN can remove MEMBER, OWNER can remove anyone)
  IF v_actor_id != p_user_id THEN -- Allow self-removal
    IF NOT is_clubhouse_member(p_clubhouse_id, 'ADMIN') THEN
      RAISE EXCEPTION 'Forbidden: Must be admin to remove members';
    END IF;
    -- ADMINs can only remove MEMBERs
    IF v_target_role = 'ADMIN' AND NOT is_clubhouse_member(p_clubhouse_id, 'OWNER') THEN
      RAISE EXCEPTION 'Forbidden: Only owners can remove admins';
    END IF;
  END IF;

  -- Update membership status
  UPDATE clubhouse_memberships
  SET status = 'REMOVED', updated_at = NOW()
  WHERE clubhouse_id = p_clubhouse_id
    AND user_id = p_user_id
  RETURNING * INTO v_membership;

  -- Audit log
  INSERT INTO audit_log (user_id, action, entity_type, entity_id, new_values)
  VALUES (
    v_actor_id,
    'remove_clubhouse_member',
    'clubhouse_membership',
    v_membership.id,
    jsonb_build_object('removed_user_id', p_user_id)
  );

  RETURN jsonb_build_object(
    'success', true,
    'membership', row_to_json(v_membership)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE clubhouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE clubhouse_memberships ENABLE ROW LEVEL SECURITY;

-- Clubhouses: members can read their clubhouses, public clubhouses readable by all
CREATE POLICY "clubhouses_select_policy" ON clubhouses FOR SELECT
  USING (
    privacy = 'public'
    OR created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM clubhouse_memberships
      WHERE clubhouse_id = clubhouses.id
        AND user_id = auth.uid()
        AND status = 'ACTIVE'
    )
  );

-- Clubhouses: only owner can insert (handled by RPC, but allow direct inserts for admin)
CREATE POLICY "clubhouses_insert_policy" ON clubhouses FOR INSERT
  WITH CHECK (created_by = auth.uid());

-- Clubhouses: admins can update
CREATE POLICY "clubhouses_update_policy" ON clubhouses FOR UPDATE
  USING (is_clubhouse_member(id, 'ADMIN'));

-- Clubhouses: only owner can delete
CREATE POLICY "clubhouses_delete_policy" ON clubhouses FOR DELETE
  USING (created_by = auth.uid());

-- Memberships: members can read memberships in their clubhouses
CREATE POLICY "clubhouse_memberships_select_policy" ON clubhouse_memberships FOR SELECT
  USING (
    user_id = auth.uid()
    OR is_clubhouse_member(clubhouse_id, 'MEMBER')
  );

-- Memberships: handled by RPC functions
CREATE POLICY "clubhouse_memberships_insert_policy" ON clubhouse_memberships FOR INSERT
  WITH CHECK (FALSE); -- Only via RPC

CREATE POLICY "clubhouse_memberships_update_policy" ON clubhouse_memberships FOR UPDATE
  USING (FALSE); -- Only via RPC

CREATE POLICY "clubhouse_memberships_delete_policy" ON clubhouse_memberships FOR DELETE
  USING (FALSE); -- Only via RPC

-- ============================================
-- GRANT PERMISSIONS
-- ============================================

GRANT EXECUTE ON FUNCTION generate_invite_code() TO authenticated;
GRANT EXECUTE ON FUNCTION is_clubhouse_member(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION rpc_create_clubhouse(TEXT, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION rpc_join_clubhouse_by_code(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION rpc_create_clubhouse_event(UUID, TEXT, DATE, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION rpc_update_clubhouse(UUID, TEXT, TEXT, TEXT, TEXT, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION rpc_regenerate_invite_code(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION rpc_update_clubhouse_member_role(UUID, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION rpc_remove_clubhouse_member(UUID, UUID) TO authenticated;

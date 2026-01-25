# RLS Policies

Row Level Security policies for Press! database.

## Overview

All tables have RLS enabled. Policies use a helper function to check membership.

## Helper Function

```sql
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
  SELECT role INTO user_role
  FROM event_memberships
  WHERE event_id = p_event_id
    AND user_id = auth.uid()
    AND status = 'ACTIVE';

  IF user_role IS NULL THEN
    RETURN FALSE;
  END IF;

  user_role_idx := array_position(role_order, user_role);
  min_role_idx := array_position(role_order, p_min_role);

  RETURN user_role_idx >= min_role_idx;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;
```

## Policy Summary

| Table | SELECT | INSERT | UPDATE | DELETE |
|-------|--------|--------|--------|--------|
| events | member or public | authenticated | owner/admin | owner |
| event_memberships | member | owner/admin | owner/admin | owner/admin |
| event_settings | member | owner | owner/admin | owner |
| games | member | admin+ | admin+ | admin+ |
| game_participants | member | admin+ | admin+ | admin+ |
| hole_scores | member | score owner | score owner | admin+ |
| teeth_balances | owner | system | system | never |
| teeth_ledger | owner | system | never | never |
| event_posts | member | member | post owner | post owner/admin |
| event_messages | member | member | never | admin |

## Detailed Policies

### events

```sql
-- SELECT: Members or public events
CREATE POLICY "events_select" ON events
  FOR SELECT
  USING (
    is_event_member(id) OR visibility = 'PUBLIC'
  );

-- INSERT: Any authenticated user can create
CREATE POLICY "events_insert" ON events
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- UPDATE: Owner or admin
CREATE POLICY "events_update" ON events
  FOR UPDATE
  USING (is_event_member(id, 'ADMIN'));

-- DELETE: Owner only
CREATE POLICY "events_delete" ON events
  FOR DELETE
  USING (created_by = auth.uid());
```

### games

```sql
-- SELECT: Event members
CREATE POLICY "games_select" ON games
  FOR SELECT
  USING (is_event_member(event_id));

-- INSERT: Admin or owner
CREATE POLICY "games_insert" ON games
  FOR INSERT
  WITH CHECK (is_event_member(event_id, 'ADMIN'));

-- UPDATE: Admin or owner
CREATE POLICY "games_update" ON games
  FOR UPDATE
  USING (is_event_member(event_id, 'ADMIN'));

-- DELETE: Admin or owner
CREATE POLICY "games_delete" ON games
  FOR DELETE
  USING (is_event_member(event_id, 'ADMIN'));
```

### hole_scores

```sql
-- SELECT: Event members
CREATE POLICY "scores_select" ON hole_scores
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM rounds r
      WHERE r.id = hole_scores.round_id
      AND is_event_member(r.event_id)
    )
  );

-- INSERT: Score owner (via round)
CREATE POLICY "scores_insert" ON hole_scores
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM rounds r
      WHERE r.id = hole_scores.round_id
      AND r.user_id = auth.uid()
    )
  );

-- UPDATE: Score owner
CREATE POLICY "scores_update" ON hole_scores
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM rounds r
      WHERE r.id = hole_scores.round_id
      AND r.user_id = auth.uid()
    )
  );
```

### teeth_balances

```sql
-- SELECT: Balance owner only
CREATE POLICY "teeth_balance_select" ON teeth_balances
  FOR SELECT
  USING (user_id = auth.uid());

-- INSERT/UPDATE/DELETE: Via RPC only (no direct access)
-- All mutations go through rpc_grant_teeth which uses service role
```

### teeth_ledger

```sql
-- SELECT: Transaction owner only
CREATE POLICY "teeth_ledger_select" ON teeth_ledger
  FOR SELECT
  USING (user_id = auth.uid());

-- INSERT: Via RPC only (immutable)
-- No UPDATE or DELETE allowed
```

## Visibility Rules

### PRIVATE Events

- All access requires membership
- Share links don't work

### UNLISTED Events

- Leaderboard visible via share_links token
- Feed and chat require membership

### PUBLIC Events

- Leaderboard publicly visible
- Feed and chat require membership

```sql
-- Example: Share link access for unlisted events
CREATE POLICY "share_link_access" ON events
  FOR SELECT
  USING (
    visibility = 'UNLISTED'
    AND EXISTS (
      SELECT 1 FROM share_links
      WHERE share_links.event_id = events.id
      AND share_links.token = current_setting('app.share_token', true)
      AND share_links.expires_at > now()
    )
  );
```

## Testing Policies

```sql
-- Test as specific user
SET LOCAL auth.uid = 'user-uuid-here';

-- Verify access
SELECT * FROM events; -- Should only see allowed events

-- Test membership check
SELECT is_event_member('event-uuid', 'PLAYER'); -- true/false
```

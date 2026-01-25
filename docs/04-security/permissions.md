# Permissions Model

## Overview

Press! uses a role-based permission model at the event level.

## Roles

Roles are ordered by privilege level:

```
OWNER > ADMIN > PLAYER > VIEWER
```

### OWNER

The event creator. Full control:
- All ADMIN permissions
- Delete event
- Transfer ownership
- Manage all settings

### ADMIN

Event administrators:
- All PLAYER permissions
- Manage memberships (invite, remove, change roles)
- Lock/unlock event
- Create/modify games
- Modify any score
- Compute settlement
- Manage calcuttas

### PLAYER

Active participants:
- All VIEWER permissions
- Enter own scores
- Create presses (if allowed by settings)
- Post in feed
- Send chat messages
- View own teeth balance

### VIEWER

Read-only observers:
- View leaderboard
- View feed (read-only)
- View chat (read-only)
- View games
- Cannot modify anything

## Permission Matrix

| Action | OWNER | ADMIN | PLAYER | VIEWER |
|--------|-------|-------|--------|--------|
| View leaderboard | ✓ | ✓ | ✓ | ✓ |
| View games | ✓ | ✓ | ✓ | ✓ |
| View feed | ✓ | ✓ | ✓ | ✓ |
| View chat | ✓ | ✓ | ✓ | ✓ |
| Enter own scores | ✓ | ✓ | ✓ | ✗ |
| Create press | ✓ | ✓ | ✓* | ✗ |
| Post in feed | ✓ | ✓ | ✓ | ✗ |
| Send chat | ✓ | ✓ | ✓ | ✗ |
| Create game | ✓ | ✓ | ✗ | ✗ |
| Modify any score | ✓ | ✓ | ✗ | ✗ |
| Manage members | ✓ | ✓ | ✗ | ✗ |
| Lock/unlock | ✓ | ✓ | ✗ | ✗ |
| Compute settlement | ✓ | ✓ | ✗ | ✗ |
| Change settings | ✓ | ✓ | ✗ | ✗ |
| Delete event | ✓ | ✗ | ✗ | ✗ |
| Transfer ownership | ✓ | ✗ | ✗ | ✗ |

*Press creation by PLAYER depends on `event_settings.allow_self_press`

## Membership States

| Status | Description |
|--------|-------------|
| PENDING | Invited, awaiting approval |
| ACTIVE | Full access per role |
| REMOVED | Access revoked |

## Implementation

### Check in Client

```typescript
function canUserDoAction(
  action: string,
  userRole: MembershipRole,
  eventSettings: EventSettings
): boolean {
  const roleLevel = {
    OWNER: 4,
    ADMIN: 3,
    PLAYER: 2,
    VIEWER: 1,
  };

  switch (action) {
    case 'view':
      return roleLevel[userRole] >= 1;
    case 'enter_score':
    case 'post':
    case 'chat':
      return roleLevel[userRole] >= 2;
    case 'create_press':
      return roleLevel[userRole] >= 2 && eventSettings.allowSelfPress;
    case 'manage':
      return roleLevel[userRole] >= 3;
    case 'delete':
      return userRole === 'OWNER';
    default:
      return false;
  }
}
```

### Check in Database (RLS)

```sql
-- Helper function
CREATE FUNCTION is_event_member(p_event_id UUID, p_min_role TEXT)
RETURNS BOOLEAN AS $$
  -- Implementation in rls-policies.md
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Usage in policy
CREATE POLICY "games_insert" ON games
  FOR INSERT
  WITH CHECK (is_event_member(event_id, 'ADMIN'));
```

## Event Visibility vs Membership

Visibility controls public access, not member permissions:

| Visibility | Non-members can... |
|------------|--------------------|
| PRIVATE | Nothing |
| UNLISTED | View leaderboard via share link |
| PUBLIC | View leaderboard publicly |

Members always have access according to their role, regardless of visibility.

## Special Cases

### Press Creation Rules

Players can create presses only if:
1. `event_settings.allow_self_press = true`
2. They are a participant in the parent game
3. Event is not locked

### Score Modification

- Players can only modify their own scores
- Admins can modify any score
- No modifications when event is locked

### Settlement Viewing

- All members can view settlement
- Only own balance details visible to players
- Admins can see all balances

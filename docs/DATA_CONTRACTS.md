# Data Contracts

This document defines the database schema contracts for Press!

## Overview

Press! uses PostgreSQL via Supabase with Row Level Security (RLS) for authorization.

## Core Types

```typescript
// Alligator Teeth - always integers
type AlligatorTeeth = number;

// Event visibility levels
type EventVisibility = 'PRIVATE' | 'UNLISTED' | 'PUBLIC';

// Membership roles (ordered by privilege)
type MembershipRole = 'OWNER' | 'ADMIN' | 'PLAYER' | 'VIEWER';

// Membership status
type MembershipStatus = 'PENDING' | 'ACTIVE' | 'REMOVED';

// Game types
type GameType = 'match_play' | 'nassau' | 'skins';

// Game status
type GameStatus = 'active' | 'complete';
```

## Tables

### events

Primary event entity.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK, default gen_random_uuid() | Event ID |
| name | text | NOT NULL | Event name |
| date | date | NOT NULL | Event date |
| visibility | text | NOT NULL, default 'PRIVATE' | PRIVATE/UNLISTED/PUBLIC |
| is_locked | boolean | NOT NULL, default false | Whether event is locked |
| created_by | uuid | FK auth.users | Owner user ID |
| created_at | timestamptz | default now() | Creation timestamp |
| updated_at | timestamptz | default now() | Last update timestamp |

### event_memberships

Maps users to events with roles.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK | Membership ID |
| event_id | uuid | FK events, NOT NULL | Event reference |
| user_id | uuid | FK auth.users, NOT NULL | User reference |
| role | text | NOT NULL | OWNER/ADMIN/PLAYER/VIEWER |
| status | text | NOT NULL, default 'ACTIVE' | PENDING/ACTIVE/REMOVED |
| created_at | timestamptz | default now() | Creation timestamp |

**Unique:** (event_id, user_id)

### event_settings

Event configuration.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| event_id | uuid | PK, FK events | Event reference |
| press_rules | jsonb | default '{}' | Press configuration |
| default_teeth | integer | default 100 | Starting teeth balance |
| allow_self_press | boolean | default true | Allow players to press |
| updated_at | timestamptz | default now() | Last update |

### courses

Golf course definitions.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK | Course ID |
| name | text | NOT NULL | Course name |
| city | text | | City |
| state | text | | State/Province |
| country | text | default 'US' | Country code |

### tee_sets

Tee sets for courses.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK | Tee set ID |
| course_id | uuid | FK courses, NOT NULL | Course reference |
| name | text | NOT NULL | e.g., "Blue", "White" |
| rating | decimal(4,1) | | Course rating |
| slope | integer | | Slope rating |

### holes

Hole definitions for tee sets.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK | Hole ID |
| tee_set_id | uuid | FK tee_sets, NOT NULL | Tee set reference |
| hole_number | integer | NOT NULL, 1-18 | Hole number |
| par | integer | NOT NULL | Par for hole |
| handicap | integer | | Handicap index (1-18) |
| yards | integer | | Distance |

### rounds

Scoring rounds for events.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK | Round ID |
| event_id | uuid | FK events, NOT NULL | Event reference |
| user_id | uuid | FK auth.users, NOT NULL | Player |
| tee_set_id | uuid | FK tee_sets | Tee set played |
| round_date | date | NOT NULL | Date played |

### hole_scores

Individual hole scores.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK | Score ID |
| round_id | uuid | FK rounds, NOT NULL | Round reference |
| hole_number | integer | NOT NULL, 1-18 | Hole number |
| strokes | integer | NOT NULL, >= 0 | Strokes taken |
| created_at | timestamptz | default now() | Creation timestamp |
| updated_at | timestamptz | default now() | Last update |

**Unique:** (round_id, hole_number)

### games

Game definitions including presses.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK | Game ID |
| event_id | uuid | FK events, NOT NULL | Event reference |
| type | text | NOT NULL | match_play/nassau/skins |
| stake_teeth_int | integer | NOT NULL, >= 0 | Stake in Teeth |
| parent_game_id | uuid | FK games, NULL | Parent for presses |
| start_hole | integer | NOT NULL, default 1 | Starting hole |
| end_hole | integer | NOT NULL, default 18 | Ending hole |
| status | text | NOT NULL, default 'active' | active/complete |
| created_at | timestamptz | default now() | Creation timestamp |

### game_participants

Players in games.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK | Participant ID |
| game_id | uuid | FK games, NOT NULL | Game reference |
| user_id | uuid | FK auth.users, NOT NULL | Player |
| team_id | uuid | NULL | Optional team |

**Unique:** (game_id, user_id)

### teeth_balances

Current Alligator Teeth balances.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK | Balance ID |
| event_id | uuid | FK events, NOT NULL | Event reference |
| user_id | uuid | FK auth.users, NOT NULL | User |
| balance_int | integer | NOT NULL, default 0 | Current balance |
| updated_at | timestamptz | default now() | Last update |

**Unique:** (event_id, user_id)

### teeth_ledger

Immutable transaction log (double-entry).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK | Transaction ID |
| event_id | uuid | FK events, NOT NULL | Event reference |
| user_id | uuid | FK auth.users, NOT NULL | User |
| delta_int | integer | NOT NULL | Change (+/-) |
| balance_int | integer | NOT NULL | Balance after |
| reason | text | NOT NULL | Description |
| reference_type | text | | game/settlement/admin |
| reference_id | uuid | | Related entity |
| created_at | timestamptz | default now() | Timestamp |

### settlements

Settlement records.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK | Settlement ID |
| event_id | uuid | FK events, NOT NULL | Event reference |
| game_id | uuid | FK games, NOT NULL | Game reference |
| payer_id | uuid | FK auth.users, NOT NULL | Who pays |
| payee_id | uuid | FK auth.users, NOT NULL | Who receives |
| amount_int | integer | NOT NULL | Teeth amount |
| status | text | default 'pending' | pending/confirmed |
| created_at | timestamptz | default now() | Creation timestamp |

## Indexes

```sql
-- Performance indexes
CREATE INDEX idx_memberships_event ON event_memberships(event_id);
CREATE INDEX idx_memberships_user ON event_memberships(user_id);
CREATE INDEX idx_games_event ON games(event_id);
CREATE INDEX idx_games_parent ON games(parent_game_id);
CREATE INDEX idx_scores_round ON hole_scores(round_id);
CREATE INDEX idx_teeth_ledger_event_user ON teeth_ledger(event_id, user_id);
```

## Constraints

- All `_teeth_int` columns are integers (no decimals for Alligator Teeth)
- `teeth_ledger` is append-only (no UPDATE, no DELETE)
- `parent_game_id` creates press hierarchy (NULL = root game)
- Role ordering: OWNER > ADMIN > PLAYER > VIEWER

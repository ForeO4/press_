# Client Services

## Overview

Client services provide a data access layer between React components and Supabase. They handle:
- Database queries via Supabase client
- Mock mode fallback for development
- Data mapping from DB schema to TypeScript types

## Service Pattern

All services follow this pattern:

```typescript
// src/lib/services/[entity].ts
import { createClient } from '@/lib/supabase/client';
import { isMockMode } from '@/lib/env/public';
import { mockData } from '@/lib/mock/data';

export async function getEntity(id: string): Promise<Entity | null> {
  if (isMockMode) {
    return mockData.find(e => e.id === id) ?? null;
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from('entities')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    throw error;
  }

  return mapEntityFromDb(data);
}
```

## Services

### events.ts

Event CRUD operations.

| Function | Description |
|----------|-------------|
| `createEvent(input, userId)` | Create new event |
| `getEvent(eventId)` | Get event by ID |
| `getUserEvents(userId)` | List user's events |
| `updateEvent(eventId, input)` | Update event |
| `deleteEvent(eventId)` | Delete event |

### scores.ts

Score CRUD operations with realtime support.

| Function | Description |
|----------|-------------|
| `upsertScore(eventId, roundId, userId, holeNumber, strokes)` | Insert or update a hole score |
| `getScoresForRound(roundId)` | Get all scores for a specific round |
| `getScoresForEvent(eventId)` | Get all scores grouped by round ID |
| `getEventRounds(eventId)` | Get rounds with userId/roundId mappings |

#### upsertScore

Uses `rpc_upsert_score` for proper permission checking and audit logging:

```typescript
await upsertScore(eventId, roundId, userId, holeNumber, strokes);
// Returns: HoleScore { id, roundId, holeNumber, strokes, createdAt, updatedAt }
```

In mock mode, maintains an in-memory score store for session persistence.

#### getEventRounds

Returns round mappings needed for score lookups:

```typescript
const { rounds, userToRound, roundToUser } = await getEventRounds(eventId);
// userToRound: { [userId]: roundId }
// roundToUser: { [roundId]: userId }
```

### courses.ts

Course and tee set data access.

| Function | Description |
|----------|-------------|
| `getCourse(courseId)` | Get course by ID |
| `getTeeSetWithHoles(teeSetId)` | Get tee set with all hole data |
| `getCourseTeeSets(courseId)` | List tee sets for a course |
| `getEventTeeSnapshot(eventId)` | Get tee snapshot for event (with mock fallback) |

#### getEventTeeSnapshot

Returns a `TeeSnapshot` containing all course/tee/hole data for an event:

```typescript
interface TeeSnapshot {
  id: string;
  eventId: string;
  teeSetId: string | null;
  courseName: string;
  teeSetName: string;
  rating: number;
  slope: number;
  holes: HoleSnapshot[];
  createdAt: string;
}

interface HoleSnapshot {
  number: number;
  par: number;
  handicap: number;
  yardage: number;
}
```

Falls back to mock data when:
- Running in mock mode (`isMockMode === true`)
- No snapshot exists in database (for development)

## Usage in Components

Services are typically called from Zustand store actions:

```typescript
// In store
loadCourseData: async (eventId) => {
  set({ loading: true });
  const data = await getEventTeeSnapshot(eventId);
  set({ courseData: data, loading: false });
}

// In component
useEffect(() => {
  loadCourseData(eventId);
}, [eventId]);
```

## Mock Mode

When `NEXT_PUBLIC_SUPABASE_URL` is not set:
- `isMockMode` returns `true`
- Services return data from `/lib/mock/` modules
- No database queries are made

### ID Generation

In mock mode, services use `crypto.randomUUID()` for generating unique IDs:
- Event IDs: `crypto.randomUUID()` (was `event-${Date.now()}`)
- Game IDs: `crypto.randomUUID()` (was `game-${Date.now()}`)
- Press IDs: `crypto.randomUUID()` (was `press-${Date.now()}`)
- Snapshot IDs: `crypto.randomUUID()` (was `snapshot-${eventId}-${Date.now()}`)

This prevents ID collisions when creating multiple entities in rapid succession.

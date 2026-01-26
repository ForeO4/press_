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

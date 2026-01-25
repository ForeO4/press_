# State Management

## Overview

Press! uses Zustand for client-side state management with a simple, hook-based API.

## Store Structure

```typescript
// src/stores/index.ts
import { create } from 'zustand';

interface AppStore {
  // Auth
  user: User | null;
  setUser: (user: User | null) => void;

  // Mock mode
  mockUser: MockUser | null;
  setMockUser: (user: MockUser | null) => void;

  // Current event
  currentEventId: string | null;
  setCurrentEventId: (id: string | null) => void;
}

export const useAppStore = create<AppStore>((set) => ({
  user: null,
  setUser: (user) => set({ user }),

  mockUser: null,
  setMockUser: (mockUser) => set({ mockUser }),

  currentEventId: null,
  setCurrentEventId: (currentEventId) => set({ currentEventId }),
}));
```

## Event Store

```typescript
// src/stores/eventStore.ts
interface EventStore {
  events: Map<string, Event>;
  setEvent: (event: Event) => void;

  memberships: Map<string, EventMembership[]>;
  setMemberships: (eventId: string, memberships: EventMembership[]) => void;

  games: Map<string, Game[]>;
  setGames: (eventId: string, games: Game[]) => void;

  scores: Map<string, HoleScore[]>;
  setScores: (roundId: string, scores: HoleScore[]) => void;
}
```

## Usage Pattern

### Reading State

```typescript
function MyComponent() {
  const user = useAppStore((state) => state.user);
  const games = useEventStore((state) => state.games.get(eventId));

  return (/* ... */);
}
```

### Updating State

```typescript
function handleScoreChange(roundId: string, hole: number, strokes: number) {
  const setScores = useEventStore.getState().setScores;

  // Optimistic update
  const currentScores = useEventStore.getState().scores.get(roundId) ?? [];
  const updatedScores = updateScore(currentScores, hole, strokes);
  setScores(roundId, updatedScores);

  // API call
  await saveScore(roundId, hole, strokes);
}
```

## Data Fetching

Combine Zustand with React Query for server state:

```typescript
function useEvent(eventId: string) {
  const setEvent = useEventStore((s) => s.setEvent);

  return useQuery({
    queryKey: ['event', eventId],
    queryFn: () => fetchEvent(eventId),
    onSuccess: (event) => setEvent(event),
  });
}
```

## Mock Mode

Mock mode uses the same stores with mock data:

```typescript
// Initialize mock data
if (isMockMode) {
  useAppStore.setState({
    mockUser: mockUsers[0],
  });

  useEventStore.setState({
    events: new Map([['demo-event', mockEvent]]),
    games: new Map([['demo-event', mockGames]]),
  });
}
```

## Persistence

Selected state can be persisted:

```typescript
import { persist } from 'zustand/middleware';

const useAppStore = create(
  persist(
    (set) => ({
      // ...
    }),
    {
      name: 'press-app-storage',
      partialize: (state) => ({
        // Only persist non-sensitive data
        currentEventId: state.currentEventId,
      }),
    }
  )
);
```

## Realtime Updates

Supabase realtime feeds into stores:

```typescript
// Subscribe to score changes
supabase
  .channel('scores')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'hole_scores',
  }, (payload) => {
    const setScores = useEventStore.getState().setScores;
    // Update scores in store
  })
  .subscribe();
```

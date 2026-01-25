# Supabase Integration

## Overview

Supabase provides the backend infrastructure for Press!:
- PostgreSQL database
- Row Level Security (RLS)
- Authentication
- Realtime subscriptions

## Configuration

### Environment Variables

```bash
# Client-safe (exposed to browser)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx

# Server-only (NEVER expose to browser)
SUPABASE_SERVICE_ROLE_KEY=xxx
```

### Client Setup

```typescript
// src/lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

### Server Setup

```typescript
// src/lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export function createServerSupabaseClient() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options) {
          cookieStore.set({ name, value: '', ...options });
        },
      },
    }
  );
}
```

## Database

### Migrations

Located in `/supabase/migrations/`:
- `0001_init.sql` - Core tables
- `0002_rls.sql` - RLS policies
- `0003_rpcs.sql` - Server functions

### Applying Migrations

```bash
# Local development
supabase db reset

# Production
supabase db push
```

### Seed Data

```bash
supabase db seed
```

## Authentication

### Sign Up

```typescript
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password',
});
```

### Sign In

```typescript
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password',
});
```

### Sign Out

```typescript
await supabase.auth.signOut();
```

### Get User

```typescript
const { data: { user } } = await supabase.auth.getUser();
```

## Realtime

### Score Updates

```typescript
supabase
  .channel('scores')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'hole_scores',
    filter: `round_id=in.(${roundIds.join(',')})`
  }, (payload) => {
    // Handle score change
  })
  .subscribe();
```

### Chat Messages

```typescript
supabase
  .channel('chat')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'event_messages',
    filter: `thread_id=eq.${threadId}`
  }, (payload) => {
    // Handle new message
  })
  .subscribe();
```

## RPC Calls

```typescript
// Call server function
const { data, error } = await supabase.rpc('rpc_compute_settlement', {
  p_event_id: eventId,
});
```

## Local Development

```bash
# Start local Supabase
supabase start

# Stop
supabase stop

# View status
supabase status

# Open Studio (database UI)
# Automatically opens at localhost:54323
```

## Mock Mode

When `NEXT_PUBLIC_SUPABASE_URL` is empty, app runs in mock mode with static data.

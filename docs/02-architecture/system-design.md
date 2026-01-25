# System Design

## Overview

Press! follows a serverless architecture with clear separation between client, edge, and server-side concerns.

## Request Flow

### Authenticated Request

```
Client → Supabase Auth → JWT → Next.js/Supabase → RLS → Response
```

1. User authenticates via Supabase Auth
2. Client receives JWT
3. All requests include JWT in header
4. Supabase validates JWT and applies RLS
5. Only authorized data returned

### Media Upload

```
Client → Worker (presign) → R2 (upload) → Worker (complete) → Supabase (record)
```

1. Client requests presigned URL
2. Worker validates JWT, returns presigned URL
3. Client uploads directly to R2
4. Client calls complete endpoint
5. Worker inserts media_objects record

## Data Architecture

### Event-Scoped Data

Most data is scoped to events:
- Memberships
- Games and presses
- Scores
- Teeth balances
- Feed and chat

### User-Global Data

Some data is user-scoped:
- Profile
- Handicap profiles
- Notification preferences

### System Data

Shared reference data:
- Courses
- Tee sets
- Holes

## Caching Strategy

### Client-Side

- React Query for data fetching
- Optimistic updates for scores
- Local storage for draft posts

### Edge (Future)

- CDN caching for public leaderboards
- Worker KV for hot paths

### Server-Side

- Supabase connection pooling
- Materialized views for leaderboards (future)

## Realtime

Supabase Realtime for:
- Score updates
- Game status changes
- Chat messages

```typescript
// Example subscription
supabase
  .channel('event:scores')
  .on('postgres_changes',
    { event: '*', schema: 'public', table: 'hole_scores' },
    (payload) => updateScore(payload)
  )
  .subscribe();
```

## Error Handling

### Client Errors

- Form validation before submission
- Optimistic UI with rollback
- Toast notifications for failures

### Server Errors

- RLS violations → 403
- Validation errors → 400 with details
- System errors → 500 (no leak)

### Audit Trail

All mutations logged to `audit_log`:
- User ID
- Action type
- Entity type and ID
- Before/after values
- Timestamp

## Scalability Considerations

### Database

- Indexes on foreign keys
- Partitioning for large events (future)
- Read replicas (Supabase Pro)

### Media

- R2 handles scale automatically
- CDN for public media

### Compute

- Serverless functions scale to zero
- Edge functions for low latency
- No persistent servers to manage

## Security Layers

1. **Network** - HTTPS everywhere
2. **Auth** - Supabase JWT validation
3. **Authorization** - RLS policies
4. **Input Validation** - Zod schemas
5. **Output Sanitization** - No sensitive data leak
6. **Audit** - All mutations logged

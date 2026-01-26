# API Contracts

This document defines the API endpoints and their contracts for Press!

## Base URL

- **Development:** `http://localhost:3000/api`
- **Production:** `https://press.app/api`

## Authentication

All authenticated endpoints require a Supabase JWT in the Authorization header:

```
Authorization: Bearer <supabase_jwt>
```

## Endpoints

### Events

#### GET /api/events

List events for the authenticated user.

**Response:**
```typescript
{
  events: Array<{
    id: string;
    name: string;
    date: string;
    visibility: 'PRIVATE' | 'UNLISTED' | 'PUBLIC';
    isLocked: boolean;
    role: 'OWNER' | 'ADMIN' | 'PLAYER' | 'VIEWER';
  }>;
}
```

#### GET /api/events/:eventId

Get event details.

**Response:**
```typescript
{
  event: {
    id: string;
    name: string;
    date: string;
    visibility: 'PRIVATE' | 'UNLISTED' | 'PUBLIC';
    isLocked: boolean;
    createdBy: string;
    settings: EventSettings;
  };
}
```

### Scores

#### POST /api/events/:eventId/scores

Upsert a hole score.

**Request:**
```typescript
{
  roundId: string;
  userId: string;
  holeNumber: number; // 1-18
  strokes: number; // integer
}
```

**Response:**
```typescript
{
  score: {
    id: string;
    roundId: string;
    userId: string;
    holeNumber: number;
    strokes: number;
    updatedAt: string;
  };
}
```

### Games

#### GET /api/events/:eventId/games

List games for an event.

**Response:**
```typescript
{
  games: Array<{
    id: string;
    type: 'match_play' | 'nassau' | 'skins';
    stake: number; // Alligator Teeth
    parentGameId: string | null;
    startHole: number;
    endHole: number;
    status: 'active' | 'complete';
    participants: Array<{
      userId: string;
      userName: string;
    }>;
  }>;
}
```

#### POST /api/events/:eventId/games

Create a new game.

**Request:**
```typescript
{
  type: 'match_play' | 'nassau' | 'skins'; // Primary contest type
  contests?: Array<{                        // Optional: all enabled contests
    type: 'match_play' | 'nassau' | 'skins';
    enabled: boolean;
    scoringBasis: 'net' | 'gross';
  }>;
  stake: number;                            // Alligator Teeth (integer)
  participantIds: string[];
  startHole?: number;                       // default 1
  endHole?: number;                         // default 18
  scoringBasis?: 'net' | 'gross';          // default 'net'
}
```

### Presses

#### POST /api/events/:eventId/presses

Create a press (child game).

**Request:**
```typescript
{
  parentGameId: string;
  startHole: number; // 1-18
  stake: number; // Alligator Teeth (integer)
}
```

**Response:**
```typescript
{
  press: {
    id: string;
    parentGameId: string;
    startHole: number;
    endHole: number; // inherited from parent
    stake: number;
    status: 'active';
  };
}
```

**Validation:**
- `startHole` must be > current hole
- `startHole` must be <= parent's `endHole`
- `stake` must be a non-negative integer (0 allowed for friendly games)

### Settlement

#### GET /api/events/:eventId/settlement

Get current settlement state.

**Response:**
```typescript
{
  settlements: Array<{
    payerId: string;
    payerName: string;
    payeeId: string;
    payeeName: string;
    amount: number; // Alligator Teeth
    gameId: string;
    status: 'pending' | 'confirmed';
  }>;
  lastComputed: string | null;
}
```

#### POST /api/events/:eventId/settlement/compute

Compute settlement for all games.

**Response:**
```typescript
{
  settlements: Array<Settlement>;
  snapshot: {
    id: string;
    computedAt: string;
  };
}
```

### Teeth

#### GET /api/events/:eventId/teeth/balance

Get current user's teeth balance for event.

**Response:**
```typescript
{
  balance: number; // Alligator Teeth (integer)
  eventId: string;
  userId: string;
}
```

#### GET /api/events/:eventId/teeth/ledger

Get teeth transaction history.

**Response:**
```typescript
{
  transactions: Array<{
    id: string;
    delta: number;
    balance: number;
    reason: string;
    createdAt: string;
  }>;
}
```

### Media (R2 Worker)

#### POST /media/presign/upload

Get presigned URL for upload.

**Request:**
```typescript
{
  eventId: string;
  kind: 'avatars' | 'posts' | 'chat' | 'exports';
  contentType: string;
  filename: string;
}
```

**Response:**
```typescript
{
  uploadUrl: string; // presigned PUT URL
  mediaId: string;
  expiresAt: string;
}
```

#### POST /media/complete

Mark upload as complete.

**Request:**
```typescript
{
  mediaId: string;
}
```

#### GET /media/:mediaId

Stream media file (auth required).

## Error Responses

All errors follow this format:

```typescript
{
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}
```

### Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `UNAUTHORIZED` | 401 | Missing or invalid JWT |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `VALIDATION_ERROR` | 400 | Invalid request body |
| `EVENT_LOCKED` | 409 | Event is locked for changes |
| `RATE_LIMITED` | 429 | Too many requests |

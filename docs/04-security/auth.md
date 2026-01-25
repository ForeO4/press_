# Authentication

## Overview

Press! uses Supabase Auth for authentication with JWT-based sessions.

## Supported Methods

### Email/Password

Standard email and password authentication:
1. User registers with email
2. Confirmation email sent
3. User confirms and can sign in

### Magic Link

Passwordless email authentication:
1. User enters email
2. Magic link sent to email
3. User clicks link to sign in

### Social Providers (Future)

Planned support for:
- Google
- Apple

## JWT Flow

```
┌─────────┐      ┌─────────────┐      ┌──────────┐
│ Client  │      │ Supabase    │      │ Database │
│         │      │ Auth        │      │          │
└────┬────┘      └──────┬──────┘      └────┬─────┘
     │                  │                   │
     │  Sign In         │                   │
     ├─────────────────>│                   │
     │                  │                   │
     │  JWT (access +   │                   │
     │  refresh)        │                   │
     │<─────────────────┤                   │
     │                  │                   │
     │  API Request     │                   │
     │  + JWT           │                   │
     ├──────────────────┼──────────────────>│
     │                  │                   │
     │                  │  Validate JWT     │
     │                  │  Apply RLS        │
     │                  │<──────────────────┤
     │                  │                   │
     │  Response        │                   │
     │<─────────────────┼───────────────────┤
```

## Token Management

### Access Token

- Short-lived (1 hour default)
- Contains user ID and metadata
- Sent with every request

### Refresh Token

- Long-lived (1 week default)
- Used to get new access token
- Stored securely (httpOnly cookie)

### Token Refresh

```typescript
// Automatic refresh with Supabase client
const { data, error } = await supabase.auth.refreshSession();
```

## Session Handling

### Client-Side

```typescript
// Initialize Supabase client
const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Listen for auth changes
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_IN') {
    // Handle sign in
  } else if (event === 'SIGNED_OUT') {
    // Handle sign out
  }
});
```

### Server-Side

```typescript
// In API routes or server components
import { createServerClient } from '@supabase/ssr';

const supabase = createServerClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { cookies }
);

const { data: { user } } = await supabase.auth.getUser();
```

## Mock Mode Authentication

In mock mode (no Supabase URL), use switchable demo users:

```typescript
// Demo users for mock mode
const mockUsers = [
  { id: 'demo-owner', name: 'Alex Owner', role: 'OWNER' },
  { id: 'demo-admin', name: 'Blake Admin', role: 'ADMIN' },
  { id: 'demo-player1', name: 'Casey Player', role: 'PLAYER' },
  { id: 'demo-player2', name: 'Dana Player', role: 'PLAYER' },
];
```

User switcher appears in header during mock mode.

## Security Considerations

1. **HTTPS Only** - All traffic encrypted
2. **Secure Cookies** - httpOnly, secure, sameSite
3. **Token Validation** - Always validate on server
4. **No Token Storage** - Don't store in localStorage
5. **Session Invalidation** - Sign out clears all tokens

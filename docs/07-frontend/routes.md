# Routes

## Route Structure

```
/                           # Landing page
/app                        # Dashboard (authenticated)
/event/[eventId]            # Event home
/event/[eventId]/scorecard  # Scorecard
/event/[eventId]/games      # Games + presses
/event/[eventId]/games/[gameId] # Game detail with scorecard
/event/[eventId]/settlement # Settlement
/event/[eventId]/feed       # Social feed
/event/[eventId]/chat       # Group chat
/event/[eventId]/admin      # Admin settings
/event/[eventId]/settings   # Event settings (owner)
/docs                       # Documentation map
```

## Route Details

### / (Landing)

Public landing page:
- Hero section
- Feature highlights
- Sign up CTA

### /app (Dashboard)

Authenticated user dashboard:
- List of user's events
- Create event button
- Quick stats

### /event/[eventId] (Event Home)

Event overview:
- Event name and date
- Leaderboard preview
- Quick navigation tabs

### /event/[eventId]/scorecard

Scorecard view:
- 4-player grid
- Hole-by-hole scores
- Score entry for own scores

### /event/[eventId]/games

Games and presses:
- List of all games
- Nested presses
- Create game (admin)
- Press button (if allowed)

### /event/[eventId]/games/[gameId]

Game detail page:
- Back navigation to games list
- Game type pill and stake display
- Player avatars and names (large)
- Match status progress bar
- Mini scorecard for both players (with inline editing)
- Par-relative score coloring
- Hole winner indicators (A/B/tie)
- Presses section (nested games)
- Press and End Match action buttons

### /event/[eventId]/settlement

Settlement view:
- Payer → Payee list
- Net positions
- Compute button (admin)
- Disclaimer

### /event/[eventId]/feed

Social feed:
- Post list
- Comments and reactions
- Post composer

### /event/[eventId]/chat

Group chat:
- Message thread
- Chat input
- System messages

### /event/[eventId]/admin

Admin settings:
- Lock/unlock toggle
- Press rules
- Member management

### /event/[eventId]/settings

Event settings (owner only):
- Edit event name
- Edit event date
- Change visibility
- Delete event (with confirmation)

## Route Protection

```typescript
// middleware.ts
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  const { data: { session } } = await supabase.auth.getSession();

  // Protected routes
  if (req.nextUrl.pathname.startsWith('/app') && !session) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  if (req.nextUrl.pathname.startsWith('/event') && !session) {
    // Check if public event
    // ...
  }

  return res;
}
```

## Layout Structure

```
app/
├── layout.tsx          # Root layout
├── page.tsx            # Landing
├── app/
│   ├── layout.tsx      # Dashboard layout
│   └── page.tsx        # Dashboard
└── event/
    └── [eventId]/
        ├── layout.tsx  # Event layout (tabs)
        ├── page.tsx    # Event home
        ├── scorecard/page.tsx
        ├── games/
        │   ├── page.tsx          # Games list
        │   └── [gameId]/page.tsx # Game detail
        ├── settlement/page.tsx
        ├── feed/page.tsx
        ├── chat/page.tsx
        ├── admin/page.tsx
        └── settings/page.tsx
```

# Glossary

Definitions of key terms used throughout Press!

## Product Terms

### Alligator Teeth

The fun currency used in Press! for all betting-style games. Key characteristics:
- **Integers only** - No decimal values (5 teeth, not 5.5 teeth)
- **No cash value** - Purely for fun, not real money
- **Event-scoped** - Balances are per-event, not global
- **Double-entry tracked** - Every transaction logged in ledger

### Press!

The name of this application. Always written with:
- Capital "P"
- Exclamation point at the end
- Examples: "Press!", "the Press! app", "Press! event"

### Press (Game Action)

In golf betting, a "press" is a new side bet that starts during an existing game:
- Created when one player is losing
- Starts from current hole to end of original game
- Has its own stake (in Alligator Teeth)
- Modeled as a child game with `parent_game_id`

## Golf Terms

### Handicap

A numerical measure of a golfer's ability:
- Lower handicap = better player
- Used to adjust scores for fair competition
- Entered manually in Press! (no GHIN automation)

### Match Play

A game format where players compete hole-by-hole:
- Win hole = +1, Lose hole = -1, Tie = 0
- Final score is net holes won/lost
- Common press trigger: down by 2+ holes

### Nassau

Three separate bets in one:
- Front 9 (holes 1-9)
- Back 9 (holes 10-18)
- Overall 18

### Skins

A game where each hole has value:
- Lowest score on hole wins the "skin"
- Ties carry over to next hole
- All skins distributed at end

### Calcutta

An auction-style betting pool:
- Teams/players are "sold" to bidders
- Winning bidder owns that team's performance
- Payouts based on finishing position
- House cut may apply

## System Terms

### Event

A Press! event is a golf outing or tournament:
- Has members with roles
- Contains games, scores, feed, chat
- Can be PRIVATE, UNLISTED, or PUBLIC

### Visibility

Event access levels:
- **PRIVATE** - Members only
- **UNLISTED** - Leaderboard via share links
- **PUBLIC** - Leaderboard publicly visible

### Lock

Events can be "locked" by admin:
- Prevents score changes
- Prevents new games/presses
- Used after event completion

### Settlement

The process of determining who owes what:
- Computed from game results
- Expressed in Alligator Teeth
- Can be recomputed if scores change

## Role Terms

### Owner

The user who created the event:
- Full administrative control
- Can delete event
- Can transfer ownership

### Admin

Event administrators:
- Can manage members
- Can lock/unlock event
- Cannot delete event

### Player

Active participants:
- Can enter scores
- Can create presses (if allowed)
- Can post in feed

### Viewer

Read-only access:
- Can see leaderboard
- Can see feed
- Cannot modify anything

## Technical Terms

### RLS (Row Level Security)

PostgreSQL feature for data access control:
- Policies define who can see/modify rows
- Enforced at database level
- Cannot be bypassed by client

### Service Role Key

Supabase key that bypasses RLS:
- **Server-only** - Never expose to client
- Used for admin operations
- Must be stored securely

### Mock Mode

Development mode without backend:
- Activated when `NEXT_PUBLIC_SUPABASE_URL` is empty
- Uses static demo data
- Allows UI development without Supabase

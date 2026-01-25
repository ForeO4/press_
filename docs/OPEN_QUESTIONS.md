# Open Questions

This document tracks unresolved questions and ongoing discussions for Press!

## Format

```markdown
## Q: [Question Title]

**Status:** Open | Resolved | Deferred
**Opened:** YYYY-MM-DD
**Owner:** @username

### Context
[Background and why this matters]

### Options Considered
1. Option A - [pros/cons]
2. Option B - [pros/cons]

### Discussion
[Ongoing discussion notes]

### Resolution
[Final decision if resolved]
```

---

## Q: Live Calcutta Bidding in v1?

**Status:** Deferred
**Opened:** 2024-01-15
**Owner:** Product Team

### Context
Calcuttas traditionally have live auction bidding. This is complex to implement with real-time updates, bid validation, and auction timing.

### Options Considered
1. **Full live bidding** - WebSocket-based real-time auction
2. **Results entry only** - Admin enters final bid results manually
3. **Simplified bidding** - Sequential bids without real-time competition

### Discussion
For v1, we want to focus on core scoring and games. Live bidding adds significant complexity.

### Resolution
Deferred. v1 focuses on results entry + payout calculation. Live bidding will be considered for v2.

---

## Q: Handicap Snapshot Timing

**Status:** Open
**Opened:** 2024-01-15
**Owner:** Backend Team

### Context
When should we snapshot handicaps for an event? Options include event creation, first tee time, or admin trigger.

### Options Considered
1. **Event creation** - Simple but may be too early
2. **First tee time** - Accurate but requires scheduled job
3. **Admin trigger** - Flexible but requires admin action

### Discussion
Leaning toward admin trigger with optional auto-snapshot at first tee time.

---

## Q: Offline Score Entry

**Status:** Open
**Opened:** 2024-01-15
**Owner:** Frontend Team

### Context
Golf courses often have poor cell coverage. Should we support offline score entry with sync?

### Options Considered
1. **Offline-first PWA** - Full offline support with background sync
2. **Online-only** - Simpler but may frustrate users
3. **Deferred entry** - Allow entering scores after round

### Discussion
PWA with service worker could enable offline. Need to handle conflict resolution.

---

## Q: Team Games Support

**Status:** Open
**Opened:** 2024-01-15
**Owner:** Product Team

### Context
Some golf games are team-based (e.g., best ball, scramble). Current schema focuses on individual games.

### Options Considered
1. **Team entity** - Add teams table, games reference teams
2. **Participant groups** - game_participants can have team_id
3. **Game type handling** - Handle teams at game type level

### Discussion
Participant groups with optional team_id seems most flexible.

# Alligator Teeth

## Overview

**Alligator Teeth** are the fun currency in Press! for all betting-style games. They have NO cash value and are purely for fun and bragging rights.

## Key Rules

| Rule | Description |
|------|-------------|
| **Integers Only** | No decimal values (5 Teeth, not 5.5 Teeth) |
| **No Cash Value** | Purely for fun, not real money |
| **Event-Scoped** | Balances are per-event, not global |
| **Cannot Go Negative** | Balance floor is 0 |

## Why "Alligator Teeth"?

- Memorable and fun name
- Clearly not real currency
- Golf course theme (water hazards!)
- Easy plural form

## Data Model

### Teeth Balance

Current balance per user per event (denormalized for performance):

```typescript
interface TeethBalance {
  id: string;
  eventId: string;
  userId: string;
  balanceInt: number;  // Current balance
  updatedAt: string;
}
```

### Teeth Ledger

Immutable transaction log (double-entry):

```typescript
interface TeethLedgerEntry {
  id: string;
  eventId: string;
  userId: string;
  deltaInt: number;     // Change (+/-)
  balanceInt: number;   // Balance after
  reason: string;       // Description
  referenceType: string | null; // game, settlement, admin
  referenceId: string | null;   // Related entity ID
  createdAt: string;
}
```

## Double-Entry Accounting

Every Teeth transaction creates ledger entries:

```
Example: Alex pays Blake 10 Teeth

Ledger Entry 1:
  user: Alex
  delta: -10
  balance: 90
  reason: "Match play loss to Blake"

Ledger Entry 2:
  user: Blake
  delta: +10
  balance: 110
  reason: "Match play win from Alex"

Sum of deltas = 0 (zero-sum)
```

## Initial Balance

When user joins event:
1. Admin grants starting Teeth
2. Default from `event_settings.default_teeth` (e.g., 100)
3. Ledger entry: "Initial balance"

## Transaction Types

| Type | Description |
|------|-------------|
| `initial` | Starting balance grant |
| `game_win` | Won a game |
| `game_loss` | Lost a game |
| `press_win` | Won a press |
| `press_loss` | Lost a press |
| `calcutta_bid` | Bid in calcutta |
| `calcutta_win` | Calcutta payout |
| `admin_grant` | Admin adjustment |
| `admin_deduct` | Admin adjustment |

## Operations

### Grant Teeth

```typescript
async function grantTeeth(
  eventId: string,
  userId: string,
  delta: number,
  reason: string
): Promise<void> {
  // 1. Get current balance
  const current = await getBalance(eventId, userId);

  // 2. Calculate new balance
  const newBalance = Math.max(0, current + delta);

  // 3. Insert ledger entry
  await insertLedger({
    eventId,
    userId,
    deltaInt: delta,
    balanceInt: newBalance,
    reason,
  });

  // 4. Update balance
  await updateBalance(eventId, userId, newBalance);
}
```

### View Balance

```typescript
async function getBalance(eventId: string, userId: string): Promise<number> {
  const { data } = await supabase
    .from('teeth_balances')
    .select('balance_int')
    .eq('event_id', eventId)
    .eq('user_id', userId)
    .single();

  return data?.balance_int ?? 0;
}
```

### View History

```typescript
async function getHistory(eventId: string, userId: string) {
  const { data } = await supabase
    .from('teeth_ledger')
    .select('*')
    .eq('event_id', eventId)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  return data;
}
```

## UI Components

### Balance Display

Shows current Teeth balance:
- Prominent in event header
- Updates in real-time
- Shows Teeth icon/emoji

### Ledger View

Transaction history:
- Date/time
- Delta (+/-) with color coding
- Running balance
- Reason description

## Security

- Ledger is append-only (no UPDATE, no DELETE)
- Balance is derived from ledger
- RLS restricts viewing to balance owner
- Mutations only via RPC (admin or system)

## Disclaimer

**Required on all settlement screens:**

> "Alligator Teeth are for fun and have no cash value."

This disclaimer:
- Appears on Settlement page
- Appears in settlement emails
- Appears in export files

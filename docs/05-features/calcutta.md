# Calcutta

## Overview

A **Calcutta** is an auction-style betting pool where participants bid on players or teams, then receive payouts based on performance.

## v1 Scope

v1 focuses on **results entry and payout calculation**:
- Admin creates pool and items
- Admin enters final bid amounts (after live auction elsewhere)
- After event, admin enters finishing positions
- System calculates payouts

**Deferred to v2:** Live real-time bidding

## How Calcuttas Work

1. **Pool Creation**: Admin sets up pool with items (players/teams)
2. **Auction**: Bidders compete to "buy" items (external for v1)
3. **Results Entry**: Admin enters winning bids
4. **Event Plays**: Golf event happens
5. **Position Entry**: Admin enters finishing positions
6. **Payout Calculation**: System distributes pool

## Data Model

### Calcutta Pool

```typescript
interface CalcuttaPool {
  id: string;
  eventId: string;
  name: string;
  mode: 'individual' | 'team';
  payoutSchema: PayoutSchema;  // How pool is distributed
  houseCut: number;  // Percentage (0-100)
  status: 'setup' | 'bidding' | 'active' | 'complete';
  createdAt: string;
}
```

### Calcutta Item

```typescript
interface CalcuttaItem {
  id: string;
  poolId: string;
  name: string;  // Player or team name
  userId: string | null;  // Link to user if applicable
  position: number | null;  // Finishing position
}
```

### Calcutta Bid

```typescript
interface CalcuttaBid {
  id: string;
  itemId: string;
  bidderId: string;  // User who won the bid
  amountInt: number;  // Winning bid in Teeth
}
```

### Calcutta Payout

```typescript
interface CalcuttaPayout {
  id: string;
  poolId: string;
  bidderId: string;
  amountInt: number;  // Payout in Teeth
  itemId: string;     // Which item won
}
```

## Payout Schema

Common schemas:

### 1. Percentage-Based

```typescript
const schema: PayoutSchema = {
  type: 'percentage',
  distribution: [
    { position: 1, percentage: 50 },
    { position: 2, percentage: 30 },
    { position: 3, percentage: 20 },
  ]
};
```

### 2. Points-Based

```typescript
const schema: PayoutSchema = {
  type: 'points',
  distribution: [
    { position: 1, points: 100 },
    { position: 2, points: 60 },
    { position: 3, points: 40 },
    // ... more positions
  ]
};
```

## Payout Calculation

```typescript
function calculatePayouts(
  pool: CalcuttaPool,
  items: CalcuttaItem[],
  bids: CalcuttaBid[]
): CalcuttaPayout[] {
  // 1. Calculate total pool
  const totalBids = bids.reduce((sum, b) => sum + b.amountInt, 0);

  // 2. Apply house cut
  const houseCutAmount = Math.floor(totalBids * pool.houseCut / 100);
  const distributablePool = totalBids - houseCutAmount;

  // 3. Apply payout schema
  const payouts: CalcuttaPayout[] = [];

  for (const tier of pool.payoutSchema.distribution) {
    const item = items.find(i => i.position === tier.position);
    if (!item) continue;

    const bid = bids.find(b => b.itemId === item.id);
    if (!bid) continue;

    const amount = Math.floor(distributablePool * tier.percentage / 100);

    payouts.push({
      poolId: pool.id,
      bidderId: bid.bidderId,
      amountInt: amount,
      itemId: item.id,
    });
  }

  return payouts;
}
```

## Ownership Splits

Items can have multiple owners (split ownership):

```typescript
interface CalcuttaOwnershipSplit {
  id: string;
  bidId: string;
  userId: string;
  percentage: number;  // 0-100
}
```

Payouts are split according to ownership percentages.

## UI Flow (v1)

### 1. Create Pool

- Admin goes to Calcutta section
- Creates pool with name, mode, schema
- Optionally sets house cut

### 2. Add Items

- Admin adds items (players or teams)
- Links to event participants if applicable

### 3. Enter Bids

- After external auction completes
- Admin enters winning bid for each item
- Specifies bidder and amount

### 4. Enter Positions

- After event completes
- Admin enters finishing position for each item

### 5. Settle

- Admin clicks "Calculate Payouts"
- System shows payout breakdown
- Payouts credited to bidder Teeth balances

## RPC Functions

```sql
-- Create calcutta pool
CREATE FUNCTION rpc_create_calcutta_pool(
  p_event_id UUID,
  p_name TEXT,
  p_mode TEXT,
  p_schema JSONB,
  p_house_cut INT
) RETURNS UUID;

-- Settle calcutta
CREATE FUNCTION rpc_settle_calcutta(p_pool_id UUID)
RETURNS JSONB;
```

## Future: Live Bidding (v2)

Planned features:
- Real-time auction interface
- WebSocket bid updates
- Auction timer
- Bid validation
- Auto-outbid notifications

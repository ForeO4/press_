# Stripe Integration

## Important: Scope Limitation

**Stripe is ONLY used for event registration fees.**

Stripe is NOT used for:
- Game stakes
- Press bets
- Calcutta bids
- Any Alligator Teeth transactions

All in-app betting uses Alligator Teeth (fun currency with no cash value).

## Use Cases

1. **Event Registration Fees** - Pay to join an event
2. **Corporate Event Payments** - Company outing fees

## Environment Variables

```bash
# Server-only
STRIPE_SECRET_KEY=sk_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# Client-safe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_xxx
```

## Checkout Flow

### 1. Create Checkout Session (Server)

```typescript
// src/app/api/checkout/route.ts
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: Request) {
  const { eventId, userId } = await req.json();

  // Get event details
  const event = await getEvent(eventId);

  // Create checkout session
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [{
      price_data: {
        currency: 'usd',
        product_data: {
          name: `Registration: ${event.name}`,
        },
        unit_amount: event.registrationFee * 100, // cents
      },
      quantity: 1,
    }],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/event/${eventId}?registered=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/event/${eventId}`,
    metadata: {
      eventId,
      userId,
    },
  });

  return Response.json({ url: session.url });
}
```

### 2. Redirect to Checkout (Client)

```typescript
const handleRegister = async () => {
  const { url } = await fetch('/api/checkout', {
    method: 'POST',
    body: JSON.stringify({ eventId, userId }),
  }).then(r => r.json());

  window.location.href = url;
};
```

### 3. Handle Webhook (Server)

```typescript
// src/app/api/webhooks/stripe/route.ts
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature')!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    return new Response('Webhook Error', { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const { eventId, userId } = session.metadata!;

    // Add user to event
    await addEventMembership(eventId, userId, 'PLAYER');

    // Grant initial Alligator Teeth
    await grantInitialTeeth(eventId, userId);
  }

  return new Response('OK');
}
```

## Webhook Configuration

In Stripe Dashboard:
1. Go to Developers → Webhooks
2. Add endpoint: `https://press.app/api/webhooks/stripe`
3. Select events: `checkout.session.completed`
4. Copy webhook secret to `STRIPE_WEBHOOK_SECRET`

## Testing

Use Stripe test mode and test cards:
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`

## Refunds

Handle manually in Stripe Dashboard. Membership removal is separate from refund.

## Future Considerations

- Subscription for premium features
- Group payment splitting
- Refund automation

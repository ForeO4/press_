# Security Boundaries

This document defines the security perimeter and trust boundaries for Press!

## Trust Zones

### Zone 1: Client (Untrusted)

**Components:** Browser, PWA, any client-side code

**Trust Level:** None - all input must be validated

**Allowed:**
- NEXT_PUBLIC_* environment variables
- Supabase anon key (restricted by RLS)
- Public API endpoints

**Never Allowed:**
- Service role keys
- R2 credentials
- Stripe secret keys

### Zone 2: Edge (Semi-Trusted)

**Components:** Cloudflare Workers, Next.js Edge Runtime

**Trust Level:** Limited - can validate JWTs, enforce rate limits

**Allowed:**
- JWT validation
- Request transformation
- Caching
- Rate limiting

**Access:**
- R2 read/write (via binding)
- Supabase anon key

### Zone 3: Server (Trusted)

**Components:** Next.js API routes (Node.js runtime), Supabase functions

**Trust Level:** High - can access secrets

**Allowed:**
- Supabase service role key
- Stripe secret key
- Full database access (via RLS bypass for admin ops)

## Data Classification

### Public Data
- Event leaderboards (when visibility = PUBLIC or via share link)
- Course information

### Internal Data (Members Only)
- Event feed posts
- Chat messages
- Game details
- Score entries

### Confidential Data
- User email addresses
- Teeth balances
- Settlement details
- Audit logs

### Secret Data
- API keys
- Service role keys
- Webhook secrets

## Authentication Flow

```
Client                    Supabase Auth              Database
  │                            │                        │
  ├─── Sign In ───────────────>│                        │
  │                            │                        │
  │<── JWT (access + refresh)──┤                        │
  │                            │                        │
  ├─── API Request + JWT ──────┼───────────────────────>│
  │                            │                        │
  │                            │    RLS Policy Check    │
  │                            │<───────────────────────┤
  │                            │                        │
  │<── Response ───────────────┼────────────────────────┤
```

## RLS Policy Summary

| Table | SELECT | INSERT | UPDATE | DELETE |
|-------|--------|--------|--------|--------|
| events | members or public | authenticated | owner/admin | owner only |
| event_memberships | event members | owner/admin | owner/admin | owner/admin |
| games | event members | admin/owner | admin/owner | admin/owner |
| hole_scores | event members | score owner | score owner | admin only |
| teeth_balances | balance owner | system only | system only | never |
| teeth_ledger | balance owner | system only | never | never |

## API Security Checklist

- [ ] All endpoints validate authentication
- [ ] All endpoints validate authorization (RLS or explicit checks)
- [ ] All input is validated and sanitized
- [ ] Rate limiting is applied
- [ ] Sensitive operations are logged
- [ ] Errors don't leak internal details

## Environment Variable Security

### Client-Safe (NEXT_PUBLIC_*)
```
NEXT_PUBLIC_APP_URL
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
```

### Server-Only (Never expose to client)
```
SUPABASE_SERVICE_ROLE_KEY
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
R2_ACCESS_KEY_ID
R2_SECRET_ACCESS_KEY
```

## Incident Response

1. **Detection:** Monitor audit logs for anomalies
2. **Containment:** Revoke compromised credentials immediately
3. **Eradication:** Rotate all potentially exposed secrets
4. **Recovery:** Restore from known-good state
5. **Lessons:** Document and update security measures

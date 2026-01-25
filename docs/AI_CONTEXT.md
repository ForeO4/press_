# AI Context - Quick Project Overview

> **Purpose:** Help Claude quickly understand the Press! project.
>
> Read this document at the start of each session for fast context loading.

## Project Summary

**Press!** is a web-first PWA for golf event management with betting-style games. Players compete using "Alligator Teeth" - a fun, integer-only virtual currency with no cash value. The app handles scoring, match tracking, presses (mid-round bet escalations), Calcutta auctions, and social features. Built on Next.js 14 + Supabase + Cloudflare R2, deployed via Vercel.

## Key Architectural Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Frontend** | Next.js 14 App Router | Server components, Vercel deployment |
| **Database** | Supabase (PostgreSQL) | Managed DB, RLS, realtime subscriptions |
| **Auth** | Supabase Auth | Built-in, works with RLS |
| **State** | Zustand | Simple, performant, TypeScript-friendly |
| **Styling** | Tailwind + shadcn/ui | Utility-first, accessible components |
| **Media** | Cloudflare R2 | No egress fees, S3-compatible |
| **Payments** | Stripe | Event registration fees ONLY |

## Code Patterns to Follow

### TypeScript
- Strict mode enabled
- Prefer interfaces over types for object shapes
- Use Zod for runtime validation
- Explicit return types on exported functions

### React/Next.js
- Server Components by default, Client Components when needed
- Use `use client` directive sparingly
- Prefer Server Actions for mutations
- Use `loading.tsx` and `error.tsx` for route states

### Database
- All queries go through Supabase client
- RLS policies handle authorization - don't duplicate in app code
- Use database transactions for multi-table operations
- Alligator Teeth ledger uses double-entry bookkeeping

### Naming Conventions
- Files: kebab-case (`user-profile.tsx`)
- Components: PascalCase (`UserProfile`)
- Functions: camelCase (`getUserProfile`)
- Database: snake_case (`user_profile`)

## Common Pitfalls to Avoid

| Pitfall | Why It's Wrong | Do This Instead |
|---------|----------------|-----------------|
| Using Stripe for game bets | Legal/compliance issues | Use Alligator Teeth (fun currency) |
| Scraping GHIN | Terms of service violation | Manual handicap entry only |
| Duplicating RLS logic | Maintenance burden, security risk | Trust RLS, check in DB |
| Client-side auth checks | Can be bypassed | Use RLS + Server Components |
| Floating point for currency | Precision errors | Integer Alligator Teeth only |
| Direct DB access in components | Coupling, security | Use server actions/API routes |

## Key Files Reference

| Purpose | Location |
|---------|----------|
| Entry point docs | `docs/startup.md` |
| Database schema | `docs/03-data/schema-overview.md` |
| API contracts | `docs/API_CONTRACTS.md` |
| RLS policies | `docs/03-data/rls-policies.md` |
| Feature specs | `docs/05-features/` |
| Current backlog | `docs/08-backlog/epics.md` |
| Open questions | `docs/OPEN_QUESTIONS.md` |
| Tech debt | `docs/TECH_DEBT.md` |

## Non-Negotiables

1. **Product name** is "Press!" (with exclamation point)
2. **Alligator Teeth** are integers only, no cash value, fun only
3. **Stripe** is ONLY for event registration fees (never for games/bets)
4. **GHIN** - no scraping, manual entry only
5. **RLS** handles authorization - trust the database

## Session Workflow

1. Read `docs/NEXT_SESSION.md` for current focus
2. Check `docs/SESSION_LOG.md` for recent context
3. Review `docs/OPEN_QUESTIONS.md` for blockers
4. Work on tasks
5. Log progress to `SESSION_LOG.md`
6. Update `NEXT_SESSION.md` with next tasks

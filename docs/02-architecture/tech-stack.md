# Tech Stack

## Overview

Press! uses a modern, serverless-first stack optimized for developer productivity and operational simplicity.

## Frontend

| Technology | Purpose |
|------------|---------|
| **Next.js 14** | React framework with App Router |
| **TypeScript** | Type safety |
| **Tailwind CSS** | Utility-first styling |
| **shadcn/ui** | Component library |
| **Zustand** | State management |
| **Vitest** | Unit testing |

### Why Next.js?

- Server components for performance
- App Router for layouts and nested routes
- API routes for server-side logic
- Built-in image optimization
- Vercel deployment simplicity

### Why shadcn/ui?

- Pre-built accessible components
- Tailwind-based, fully customizable
- Copy-paste, not a dependency
- Consistent design system

## Backend

| Technology | Purpose |
|------------|---------|
| **Supabase** | Database + Auth + Realtime |
| **PostgreSQL** | Primary database |
| **Row Level Security** | Authorization at DB level |
| **Supabase Auth** | Authentication |

### Why Supabase?

- Managed PostgreSQL with RLS
- Built-in auth with multiple providers
- Realtime subscriptions
- Auto-generated APIs
- Good free tier for development

## Media Storage

| Technology | Purpose |
|------------|---------|
| **Cloudflare R2** | Object storage (S3-compatible) |
| **Cloudflare Workers** | Media proxy |
| **Hono** | Worker framework |

### Why R2?

- No egress fees
- S3-compatible API
- Global CDN built-in
- Workers for custom logic

## Payments

| Technology | Purpose |
|------------|---------|
| **Stripe** | Event registration fees ONLY |

### Stripe Scope

**Used for:**
- Event registration fees
- Corporate event payments

**NOT used for:**
- Game stakes (use Alligator Teeth)
- Calcutta bids (use Alligator Teeth)
- Any in-app currency

## Deployment

| Service | Component |
|---------|-----------|
| **Vercel** | Next.js hosting |
| **Supabase Cloud** | Database hosting |
| **Cloudflare** | Workers + R2 |

## Development Tools

| Tool | Purpose |
|------|---------|
| **npm** | Package manager |
| **ESLint** | Linting |
| **Prettier** | Code formatting |
| **Supabase CLI** | Local development |
| **Wrangler** | Worker development |

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                      Client (Browser)                    │
│  ┌─────────────────────────────────────────────────────┐│
│  │              Next.js App (React)                    ││
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐            ││
│  │  │Scorecard│  │  Games  │  │  Feed   │  ...       ││
│  │  └────┬────┘  └────┬────┘  └────┬────┘            ││
│  │       └───────────┬┴───────────┘                   ││
│  │                   │                                 ││
│  │            ┌──────┴───────┐                        ││
│  │            │ Zustand Store│                        ││
│  │            └──────┬───────┘                        ││
│  └───────────────────┼─────────────────────────────────┘│
└──────────────────────┼──────────────────────────────────┘
                       │
        ┌──────────────┼──────────────┐
        │              │              │
        ▼              ▼              ▼
┌───────────────┐ ┌─────────┐ ┌───────────────┐
│   Supabase    │ │ Vercel  │ │  Cloudflare   │
│  ┌─────────┐  │ │  API    │ │  ┌─────────┐  │
│  │PostgreSQL│  │ │ Routes  │ │  │ Workers │  │
│  │  + RLS  │  │ └────┬────┘ │  └────┬────┘  │
│  └────┬────┘  │      │      │       │       │
│       │       │      │      │  ┌────┴────┐  │
│  ┌────┴────┐  │      │      │  │   R2    │  │
│  │  Auth   │  │      │      │  │ Storage │  │
│  └─────────┘  │      │      │  └─────────┘  │
└───────────────┘      │      └───────────────┘
                       │
                 ┌─────┴─────┐
                 │  Stripe   │
                 │(Payments) │
                 └───────────┘
```

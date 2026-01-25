# Local Setup

## Prerequisites

- Node.js 18+
- pnpm
- Docker (for local Supabase)
- Supabase CLI
- Wrangler CLI (for R2 worker)

## Installation

### 1. Clone Repository

```bash
git clone <repo-url>
cd press
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Run in Mock Mode

No backend needed - app uses static demo data:

```bash
pnpm dev
```

Open http://localhost:3000

### 4. (Optional) Run with Local Supabase

Start Supabase:

```bash
supabase start
```

Copy environment file:

```bash
cp .env.example .env.local
```

Fill in values from `supabase status`:

```bash
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
```

Apply migrations and seed:

```bash
supabase db reset
```

Run app:

```bash
pnpm dev
```

### 5. (Optional) Run R2 Worker

```bash
cd workers/media-proxy
pnpm install
wrangler dev
```

## Common Tasks

### Reset Database

```bash
supabase db reset
```

### Apply New Migration

```bash
supabase migration new <name>
# Edit the migration file
supabase db reset
```

### View Database

Open Supabase Studio at http://localhost:54323

### Run Tests

```bash
pnpm test
```

### Lint

```bash
pnpm lint
```

### Format

```bash
pnpm format
```

## Troubleshooting

### Supabase won't start

Check Docker is running:
```bash
docker ps
```

### Port conflicts

Default ports:
- Next.js: 3000
- Supabase API: 54321
- Supabase Studio: 54323

Change in `supabase/config.toml` or Next.js with `pnpm dev -p 3001`.

### Mock mode not working

Ensure `NEXT_PUBLIC_SUPABASE_URL` is not set in `.env.local`.

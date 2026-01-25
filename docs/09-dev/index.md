# Development

Development guides and conventions.

## Contents

- [local-setup.md](./local-setup.md) - Local development setup
- [testing.md](./testing.md) - Testing guide
- [conventions.md](./conventions.md) - Code conventions

## Quick Start

```bash
# Clone and install
git clone <repo>
cd press
pnpm install

# Run in mock mode (no backend needed)
pnpm dev

# Run with local Supabase
supabase start
cp .env.example .env.local
# Fill in local Supabase values
pnpm dev
```

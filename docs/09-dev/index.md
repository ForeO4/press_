# Development

Development guides and conventions.

## Contents

- [local-setup.md](./local-setup.md) - Local development setup
- [testing.md](./testing.md) - Testing guide
- [conventions.md](./conventions.md) - Code conventions

## Quick Start

```bash
# Clone and install
git clone https://github.com/ForeO4/press_.git
cd press_
npm install

# Run in mock mode (no backend needed)
npm run dev

# Run with local Supabase
supabase start
cp .env.example .env.local
# Fill in local Supabase values
npm run dev
```

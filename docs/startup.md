# Press! Documentation - Start Here

> **Single Source of Truth (SSOT) Entry Point**
>
> This is the authoritative starting point for all Press! documentation. Read this first.

## What is Press!

**Press!** is a production-minded web-first PWA for golf events with betting-style games using "Alligator Teeth" fun currency, backed by Supabase + Cloudflare R2.

### Key Non-Negotiables

| Rule | Description |
|------|-------------|
| **Product Name** | Always "Press!" with exclamation point |
| **Currency** | Alligator Teeth (integers only, no cash value, fun only) |
| **Stripe Usage** | ONLY for event registration fees (NOT for games/calcuttas/presses) |
| **GHIN** | No scraping or automation - manual entry only |

## Quick Navigation

### Core Documents

| Document | Purpose |
|----------|---------|
| [DOCS_RULES.md](./DOCS_RULES.md) | Documentation governance and standards |
| [DOCS_MANIFEST.yml](./DOCS_MANIFEST.yml) | Machine-readable doc registry |
| [CHANGELOG.md](./CHANGELOG.md) | Version history |
| [DECISIONS.md](./DECISIONS.md) | Architectural Decision Records (ADRs) |
| [OPEN_QUESTIONS.md](./OPEN_QUESTIONS.md) | Unresolved questions and discussions |

### By Domain

| Domain | Entry Point |
|--------|-------------|
| **Overview** | [00-overview/](./00-overview/) - Vision, glossary, roadmap |
| **Product** | [01-product/](./01-product/) - Personas, user-flows, features |
| **Architecture** | [02-architecture/](./02-architecture/) - System design, tech stack |
| **Data** | [03-data/](./03-data/) - Schema, RLS, caching |
| **Security** | [04-security/](./04-security/) - Threat model, auth, permissions |
| **Features** | [05-features/](./05-features/) - Scoring, games, presses, calcutta |
| **Integrations** | [06-integrations/](./06-integrations/) - Supabase, R2, Stripe |
| **Frontend** | [07-frontend/](./07-frontend/) - Routes, components, state |
| **Backlog** | [08-backlog/](./08-backlog/) - Backlog, epics, milestones |
| **Development** | [09-dev/](./09-dev/) - Local dev, testing, conventions |

### Contracts & Operations

| Document | Purpose |
|----------|---------|
| [API_CONTRACTS.md](./API_CONTRACTS.md) | API endpoint specifications |
| [DATA_CONTRACTS.md](./DATA_CONTRACTS.md) | Database schema contracts |
| [SECURITY_BOUNDARIES.md](./SECURITY_BOUNDARIES.md) | Security perimeter definitions |
| [OPERATIONS.md](./OPERATIONS.md) | Deployment, monitoring, runbooks |
| [CONTRIBUTING.md](./CONTRIBUTING.md) | How to contribute |

## Getting Started

### For New Developers

1. Read this document completely
2. Review [00-overview/glossary.md](./00-overview/glossary.md) for terminology
3. Understand the [02-architecture/tech-stack.md](./02-architecture/tech-stack.md)
4. Set up your local environment per [09-dev/local-setup.md](./09-dev/local-setup.md)

### For Feature Work

1. Check [08-backlog/](./08-backlog/) for current priorities
2. Review the relevant feature spec in [05-features/](./05-features/)
3. Follow conventions in [09-dev/conventions.md](./09-dev/conventions.md)

## Document Updates

All documentation changes must follow [DOCS_RULES.md](./DOCS_RULES.md). Key rules:

- **SSOT**: This file is the single source of truth entry point
- **Manifest**: All docs must be registered in [DOCS_MANIFEST.yml](./DOCS_MANIFEST.yml)
- **Cross-links**: Use relative links between docs
- **Versioning**: Major changes require CHANGELOG entry

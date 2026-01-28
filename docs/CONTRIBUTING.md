# Contributing to Press!

Thank you for your interest in contributing to Press!

## Getting Started

1. Read [startup.md](./startup.md) first
2. Review [00-overview/glossary.md](./00-overview/glossary.md) for terminology
3. Set up your local environment per [09-dev/local-setup.md](./09-dev/local-setup.md)

## Development Workflow

### Branch Naming

```
feat/description    # New features
fix/description     # Bug fixes
docs/description    # Documentation
refactor/description # Code refactoring
```

### Commit Messages

Follow conventional commits:

```
feat: add press creation modal
fix: correct teeth balance calculation
docs: update API contracts
refactor: extract settlement logic
```

### Pull Requests

1. Create feature branch from `main`
2. Make changes with atomic commits
3. Run full test cycle before opening PR:
   ```bash
   npm run cycle:full
   ```
4. Ensure all tests pass:
   - Brain phase (lint, types, unit tests) - **must pass**
   - Happy path E2E tests - **must pass**
   - Narf chaos tests - review failures, document known issues
5. Update relevant documentation
6. Request review

**PR Checklist:**
- [ ] `npm run cycle:brain` passes
- [ ] `npm run cycle:pinky` happy path tests pass
- [ ] Narf failures reviewed and documented
- [ ] CHANGELOG updated if user-facing
- [ ] Docs updated if applicable

## Code Standards

### TypeScript

- Strict mode enabled
- No `any` types (use `unknown` if needed)
- Explicit return types on exported functions

### React

- Functional components only
- Use hooks for state and effects
- Prefer composition over inheritance

### Testing

- Unit tests for domain logic
- Integration tests for API routes
- E2E tests for critical flows

## Documentation

All significant changes require documentation updates:

1. Update relevant docs in `/docs/`
2. Add CHANGELOG entry if user-facing
3. Add ADR for architectural changes
4. Register new docs in DOCS_MANIFEST.yml

See [DOCS_RULES.md](./DOCS_RULES.md) for full documentation standards.

## Key Terms

Remember these non-negotiables:

| Term | Usage |
|------|-------|
| **Press!** | Always with exclamation point |
| **Alligator Teeth** | Fun currency, integers only, no cash value |
| **Stripe** | ONLY for event registration fees |

## Questions?

Check [OPEN_QUESTIONS.md](./OPEN_QUESTIONS.md) or open a discussion.

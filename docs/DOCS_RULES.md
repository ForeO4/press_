# Documentation Governance Rules

## Purpose

This document defines the rules and standards for maintaining Press! documentation. All contributors must follow these guidelines.

## Core Principles

### 1. Single Source of Truth (SSOT)

- `startup.md` is the authoritative entry point
- No duplicate information across documents
- Cross-reference rather than copy
- When information conflicts, the more specific document wins

### 2. Document Registry

Every document MUST be registered in `DOCS_MANIFEST.yml` with:
- Path
- Title
- Owner (team or individual)
- Last reviewed date
- Status (draft, active, deprecated)

### 3. File Organization

```
/docs/
├── startup.md              # SSOT entry point
├── DOCS_RULES.md           # This file
├── DOCS_MANIFEST.yml       # Machine-readable registry
├── [DOMAIN]-[TOPIC].md     # Root-level cross-cutting docs
└── NN-[domain]/            # Numbered domain folders
    ├── index.md            # Domain overview
    └── [topic].md          # Topic documents
```

### 4. Naming Conventions

| Type | Pattern | Example |
|------|---------|---------|
| Domain folders | `NN-[domain]/` | `05-features/` |
| Topic files | `[topic].md` | `presses.md` |
| Root docs | `UPPER_CASE.md` | `CHANGELOG.md` |
| Templates | `_templates/` | `_templates/adr.md` |

### 5. Content Standards

#### Frontmatter (Optional but Recommended)

```yaml
---
title: Document Title
owner: @username or team-name
status: draft | active | deprecated
last_reviewed: 2024-01-15
---
```

#### Structure

1. **Title** (H1) - One per document
2. **Purpose/Overview** - What this document covers
3. **Content** - Main body with H2/H3 sections
4. **Related Documents** - Links to related docs
5. **Changelog** (optional) - Document-specific history

### 6. Cross-Referencing

- Use relative paths: `[link](./other-doc.md)`
- For deep links: `[link](./folder/doc.md#section)`
- Never use absolute paths or URLs for internal docs

### 7. Code Examples

- Use fenced code blocks with language specifier
- Keep examples minimal and focused
- Reference actual source files when possible

```typescript
// Example: Press creation
const press = createPress({
  parentGameId: game.id,
  startHole: 10,
  stake: 5, // Alligator Teeth
});
```

### 8. Diagrams

- Use Mermaid for diagrams (renders in GitHub/VS Code)
- Store complex diagrams as separate files
- Always provide text description alongside diagram

### 9. Review Process

1. All doc changes require PR review
2. Owner listed in DOCS_MANIFEST.yml must approve
3. Update `last_reviewed` date on significant changes
4. Add CHANGELOG entry for major updates

### 10. Deprecation

1. Mark document status as `deprecated` in manifest
2. Add deprecation notice at top of document
3. Link to replacement document
4. Remove after 90 days with no references

## Templates

Reusable templates are in `_templates/`:

- `adr.md` - Architectural Decision Record
- `feature-spec.md` - Feature specification
- `runbook.md` - Operational runbook

## Enforcement

- CI checks for broken links
- CI validates DOCS_MANIFEST.yml
- Required reviewers for protected docs

# Technical Debt Tracker

Track known issues, shortcuts, and improvements needed in the Press! codebase.

## Severity Levels

| Level | Description | Response Time |
|-------|-------------|---------------|
| **High** | Security risk, data integrity, or blocking issue | Address ASAP |
| **Medium** | Performance impact, maintenance burden, or UX degradation | Address in next 2-3 sprints |
| **Low** | Code quality, minor inefficiency, or nice-to-have improvement | Address when convenient |

## Format

```markdown
### TD-XXX: [Title]

**Severity:** High | Medium | Low
**Added:** YYYY-MM-DD
**Effort:** S (hours) | M (days) | L (week+)
**Area:** Frontend | Backend | Database | DevOps | Docs

**Description:**
[What the issue is]

**Impact:**
[Why this matters]

**When to Address:**
[Trigger or milestone for fixing]

**Related Code:**
- `path/to/file.ts:lineNumber`

**Resolution:**
[Notes on how to fix, or status if resolved]
```

---

## Active Tech Debt

*No active tech debt items yet.*

<!-- Example entries for reference:

### TD-001: Example - Hardcoded Configuration

**Severity:** Low
**Added:** 2025-01-25
**Effort:** S (hours)
**Area:** Backend

**Description:**
Database connection string is hardcoded in the config file instead of using environment variables.

**Impact:**
Makes deployment to different environments error-prone.

**When to Address:**
Before first staging deployment.

**Related Code:**
- `src/lib/db.ts:12`

**Resolution:**
Pending - move to environment variables.

---

### TD-002: Example - Missing Error Boundaries

**Severity:** Medium
**Added:** 2025-01-25
**Effort:** M (days)
**Area:** Frontend

**Description:**
React error boundaries are not implemented around major feature components.

**Impact:**
A crash in one component can take down the entire app.

**When to Address:**
Before beta launch.

**Related Code:**
- `src/app/layout.tsx`
- `src/components/Scorecard/`

**Resolution:**
Pending - implement error boundaries at route and feature level.

-->

---

## Resolved Tech Debt

*No resolved items yet.*

---

## Statistics

| Severity | Open | Resolved |
|----------|------|----------|
| High | 0 | 0 |
| Medium | 0 | 0 |
| Low | 0 | 0 |
| **Total** | **0** | **0** |

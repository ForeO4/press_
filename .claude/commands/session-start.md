# Session Start

Load context and show next tasks for a new coding session.

## Instructions

1. Read the following files to load context:
   - `docs/NEXT_SESSION.md` - Current focus and immediate tasks
   - `docs/SESSION_LOG.md` - Recent session history (last 2-3 sessions)
   - `docs/AI_CONTEXT.md` - Project overview and patterns
   - `docs/OPEN_QUESTIONS.md` - Any blocking decisions

2. Summarize:
   - Current focus area
   - Top 3-5 immediate tasks
   - Any active blockers
   - Key decisions from recent sessions

3. Ask if the user wants to:
   - Continue with the planned tasks
   - Reprioritize based on new information
   - Address a specific issue first

## Output Format

```
## Session Context Loaded

**Current Focus:** [area]
**Branch:** [branch name]

### Immediate Tasks
1. [ ] Task 1
2. [ ] Task 2
3. [ ] Task 3

### Blockers
- [Any blockers or "None"]

### Recent Context
- [Key points from last session]

Ready to begin. What would you like to focus on?
```

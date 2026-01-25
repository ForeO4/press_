# Session End

Log current session progress and prepare context for next session.

## Instructions

1. Review what was accomplished in this session by checking:
   - Git status and recent commits
   - Files modified
   - Tasks completed

2. Update `docs/SESSION_LOG.md`:
   - Add new session entry with today's date
   - List accomplishments
   - Note key decisions made
   - Record any blockers encountered
   - Link to commits

3. Update `docs/NEXT_SESSION.md`:
   - Update current focus area if changed
   - Set immediate next tasks (3-5 items)
   - Update active blockers
   - Update key files being worked on
   - Add any recent decisions that affect future work

4. Check for tech debt:
   - Any shortcuts taken that should be logged?
   - Any "TODO" comments added?
   - Add to `docs/TECH_DEBT.md` if needed

5. Summarize for the user:
   - What was accomplished
   - What's queued for next session
   - Any follow-up actions needed

## Output Format

```
## Session Summary

### Accomplished
- [List of completed items]

### Commits
- [commit hashes and messages]

### Next Session
- [Top 3 tasks for next time]

### Action Items
- [Any follow-up needed outside of coding]

Session logged. Files updated:
- docs/SESSION_LOG.md
- docs/NEXT_SESSION.md
```

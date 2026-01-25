# Commit Check

Review changes before committing to ensure quality and completeness.

## Instructions

1. Run `git status` and `git diff` to see all changes

2. Check each changed file for:
   - **Code quality**: Follows project conventions?
   - **TypeScript**: Types correct, no `any` abuse?
   - **Security**: No secrets, SQL injection, XSS?
   - **TODOs**: Any left-behind comments that should be addressed?
   - **Console logs**: Debug logs removed?
   - **Tests**: Related tests updated/added?

3. Verify against project rules:
   - Alligator Teeth are integers only
   - No Stripe usage for games/bets
   - RLS handles authorization
   - Proper error handling

4. Check documentation impact:
   - API changes documented?
   - Schema changes noted?
   - Any breaking changes?

5. Suggest commit message following conventional commits:
   - `feat:` new feature
   - `fix:` bug fix
   - `refactor:` code restructuring
   - `docs:` documentation only
   - `test:` test additions/changes
   - `chore:` tooling/config

## Output Format

```
## Commit Check Results

### Files Changed
- [list of files]

### Review
- [ ] Code quality: [pass/issues]
- [ ] TypeScript: [pass/issues]
- [ ] Security: [pass/issues]
- [ ] No debug logs: [pass/issues]
- [ ] Tests: [pass/issues/not applicable]

### Issues Found
- [List any issues, or "None"]

### Suggested Commit
```
git add [files]
git commit -m "[type]: [description]"
```

### Notes
- [Any additional context]
```

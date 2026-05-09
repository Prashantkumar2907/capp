---
name: capp-verification
description: Use when validating CAPP changes, choosing tests, checking performance budgets, or preparing a commit or pull request.
---

# CAPP Verification

Use this skill when asked to test, verify, review release readiness, or decide which checks are needed for a change.

## Workflow

1. Read [references/verification-matrix.md](references/verification-matrix.md).
2. Match checks to the risk area changed.
3. Prefer focused checks first, then broader gates if the change touches shared behavior.
4. Report exact commands run and whether they passed.
5. If a check cannot run, state the blocker and residual risk.

## Standard Gates

```bash
npm run typecheck
npm run lint
npm run build
npm run test
npm run test:api
npm run test:ui
npm run audit:moderate
```

Use `npm run db:verify` when database connectivity and schema expectations matter.

## Commit Readiness

- Keep unrelated changes unstaged.
- Confirm `git status --short`.
- Mention any skipped tests or environment limitations.
- Do not create or rely on session logs as proof of verification.

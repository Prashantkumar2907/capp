# CAPP Claude Project Skills

This directory contains project-scoped Claude Code skills for CAPP. Claude Code discovers skills from:

```text
.claude/skills/<skill-name>/SKILL.md
```

Each skill is intentionally narrow, has `name` and `description` frontmatter, and points to supporting reference files only when more detail is needed. This follows Claude's skill guidance: keep `SKILL.md` focused, use progressive disclosure, and prefer project skills for repeatable project knowledge.

## Skills

- `capp-architecture`: route ownership, file placement, and codebase orientation.
- `capp-api-supabase`: API contracts, validation, Supabase service boundaries, RLS/trust boundaries.
- `capp-public-ordering`: public QR ordering, cart, payment review, receipt, mobile UX, and performance budgets.
- `capp-dashboard-roles`: dashboard shell, role-aware navigation, authenticated restaurant workflows.
- `capp-verification`: test selection and release-readiness checks for this repository.

## Non-Goals

- No session log or activity log skill is included. Logging conversations or work history is not a good skill fit for this project.
- No skill stores secrets, demo credentials, tokens, or environment values.
- No skill bypasses the repository's normal verification commands.

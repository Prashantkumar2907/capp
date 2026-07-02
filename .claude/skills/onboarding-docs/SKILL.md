---
name: onboarding-docs
description: Use to keep CAPP human and AI onboarding short, current, evidence-based, and useful for setup, architecture, commands, danger zones, and glossary updates.
---

# Onboarding Docs Skill

## When to Use
- Use when updating `README.md`, `guide.md`, `.claude/project-map.md`, setup docs, runbooks, glossary, architecture notes, or future ADRs.
- Use when a feature changes local setup, environment variables, routes, data stores, migrations, deployment, or common workflows.
- Use when docs conflict with code and need conservative reconciliation.

## Required Discovery
- Read current docs: `README.md`, `guide.md`, `appdev.md`, `react_application.md`, and `.claude/project-map.md` if present.
- Check `package.json`, `.env.example`, `src/`, `supabase/`, and scripts for current truth.
- Identify conflicts. At scaffold time, `appdev.md` mentions planned pnpm/Next.js 15/Vitest/Playwright, while current `package.json` uses npm/Next.js 16 and has no test scripts.
- Do not read `.env.local` values or include secrets.

## Non-Negotiable Rules
- Keep docs short and current.
- Do not invent commands, providers, databases, or CI.
- Mark unknowns as `UNKNOWN` with evidence checked.
- Do not include secret values.
- Preserve useful domain knowledge and local workflow details.
- Prefer current executable files over older planning docs when they conflict.

## Workflow
1. Identify the audience and time budget:
   - 5-minute map.
   - Setup guide.
   - Deep architecture reference.
   - Runbook.
2. Confirm current commands and file paths from repo files.
3. Include common tasks:
   - Install dependencies.
   - Run locally.
   - Lint/build/test.
   - Configure env vars by name only.
   - Apply Supabase schema safely.
4. Map where changes go:
   - Routes: `src/app`.
   - Shared UI: `src/components`.
   - Hooks: `src/hooks`.
   - Supabase clients/types: `src/lib/supabase`.
   - SQL: `supabase`.
5. Add danger zones and unknowns.
6. Keep a glossary for domain terms such as org, branch, staff role, table, order, order item, payment, RLS, KDS, UPI, and Razorpay.

## Verification
- Check every command in docs against `package.json` or existing scripts.
- Check every path exists with `ls`, `find`, or `rg --files`.
- Search generated docs for secret-like values.
- Read back the changed docs.
- Run markdown lint/format if configured; none was detected at scaffold time.

## Common Failure Modes
- Leaving create-next-app boilerplate as the main README truth.
- Copying old blueprint plans as current implementation.
- Including `.env.local` values or private URLs.
- Writing docs longer than readers will use.
- Forgetting danger zones like reset SQL, public routes, service-role access, and payment webhooks.

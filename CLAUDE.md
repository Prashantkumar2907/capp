# CLAUDE.md

## Purpose
- This repository appears to be CAPP, a SaaS-style restaurant management application for menu management, QR table ordering, kitchen/order workflows, staff roles, payments, and analytics.
- This file governs AI-assisted development in this repo and should be treated as the stable root contract for future agents.
- Use repository evidence first: `package.json`, `package-lock.json`, `guide.md`, `src/`, `supabase/`, and current git state are more authoritative than generic assumptions.

## Repository Snapshot
- Primary languages: TypeScript/TSX for the Next.js app, SQL for Supabase schema/seed/reset files, JavaScript for a seed script, and Python scripts that generate SQL.
- Major app: Next.js 16 App Router under `src/app`, with public landing/order/receipt routes, auth routes, protected dashboard routes, and `src/app/api/v1/webhooks/razorpay/route.ts`.
- Shared code: `src/components`, `src/hooks`, `src/lib`, `src/stores`, and shadcn-style UI primitives in `src/components/ui`.
- Package manager: npm. `package-lock.json` is present and is the lockfile source of truth.
- Build/test/lint commands detected: `npm run dev`, `npm run build`, `npm run start`, `npm run lint`. No configured `test` or `typecheck` script was detected.
- Frameworks/libraries detected: Next.js, React 19, TypeScript strict mode, Tailwind CSS v4, shadcn-style components, lucide-react, Framer Motion, TanStack React Query/Table, Zustand, React Hook Form, Zod, Recharts, qrcode.react, Sonner.
- Database/state systems: Supabase/PostgreSQL SQL files in `supabase/`, RLS policies, Supabase Auth, Supabase Realtime on `orders` and `order_items`, Supabase Storage bucket `dish-images`, React Query, and Zustand cart state.
- API/payment surfaces: Razorpay webhook route, public QR ordering routes, receipt route, Supabase client/server/service-role clients, UPI payment QR flow, and direct Supabase table access from UI code.
- IaC/deployment surfaces: no Terraform/OpenTofu/Pulumi/Kubernetes/Docker/CI files detected. Docs mention Vercel and Netlify deployment.
- Observability: `console.error` exists in the Razorpay webhook. No OpenTelemetry, Sentry, Datadog, Prometheus, Grafana, or structured logger was detected.
- AI/LLM surfaces: no OpenAI/Anthropic/local LLM/RAG/vector/eval code was detected.
- Unknowns: production hosting provider, CI provider, database migration workflow, test strategy, runtime Node version pin, monitoring provider, incident process, and ownership model are UNKNOWN based on inspected files.

## Operating Contract
- Explore before editing. Read the relevant route, component, hook, SQL, script, and docs before changing them.
- Check `git status --short` before edits and before final response.
- Make small, reversible changes with narrow scope.
- Prefer existing patterns: Next.js App Router, TypeScript strict mode, `@/` imports, Supabase helpers, Zod validation, shadcn-style components, Tailwind tokens, and npm scripts.
- Do not invent APIs, services, commands, environments, queues, providers, dashboards, or tests.
- Do not claim work is verified unless the exact command or read-back was performed.
- Ask only when blocked by missing product decisions, unsafe ambiguity, credentials, or access to external systems.
- Keep final responses evidence-based: list files changed, commands/checks run, and any verification gaps.

## Context Management
- Keep this root file stable and concise; put detailed workflows in `.claude/skills/*/SKILL.md`.
- Use skills for domain-specific work such as SQL/RLS, API contracts, UI verification, dependency changes, security review, and observability.
- Preserve modified file lists, assumptions, and verification commands during compaction or handoff.
- For large investigations, use read-only subagents or separate worktrees when available.
- Start fresh context for unrelated large tasks to avoid carrying stale assumptions across features.

## Local User Skills
- User-local agent skills may be available at `~/.gemini/antigravity/skills/`.
- These are optional personal capabilities, not part of this repository.
- Use them only when relevant, inspect their `SKILL.md` before relying on them, and do not assume they are installed for other developers or CI.
- Never copy third-party local skills into this repository unless explicitly asked.

## Git and File Safety
- Check the worktree before edits and do not overwrite user-authored changes.
- Never revert user changes unless explicitly asked.
- Avoid unrelated refactors, formatting churn, dependency churn, and generated output churn.
- Do not edit generated files unless the generator is unavailable and the repo convention allows it.
- Treat `package-lock.json`, SQL schema files, Supabase RLS policies, and generated Supabase types as intentional, reviewed changes.
- Keep migrations, schemas, reset scripts, seeds, and lockfiles deliberate and easy to review.

## Dependency Protocol
- Use npm for this repo. Do not switch to pnpm, yarn, or bun without explicit instruction, even though older planning docs mention pnpm.
- Treat `package-lock.json` as source of truth.
- Do not bump unrelated dependencies.
- For any dependency change, record why, scope, direct/transitive impact, lockfile impact, and verification.
- Prefer minimal version ranges consistent with the existing ecosystem.
- Run configured dependency/security checks when they exist; none were detected in `package.json` at scaffold time.
- Do not add a package for work that can be done cleanly with the current Next.js, Supabase, TypeScript, Tailwind, Zod, or shadcn-style stack.

## Architecture Guardrails
- Maintain clear boundaries between Next.js route groups, dashboard features, public customer ordering, shared UI, hooks, Supabase clients, validation, and state stores.
- Prefer explicit contracts at boundaries: Zod schemas, TypeScript types, database constraints, RLS policies, and webhook payload validation.
- For this non-workspace repo, change the smallest affected route/component/hook/SQL file.
- Avoid hidden coupling through global stores, implicit environment variables, or cross-feature Supabase writes.
- Keep frontend/backend separation clear: browser clients use anon Supabase permissions; service-role access stays server-only.
- Prefer cohesive abstractions over line-count-driven extraction.
- Document important tradeoffs near code or in future ADRs when decisions affect schema, auth, payments, public routes, or deployment.

## Distributed State and Data Consistency
- Identify the owner of every mutable state transition, especially order status, item status, table status, payment status, staff roles, and branch/menu availability.
- Require idempotency for retries, message handlers, jobs, webhooks, and public order/payment flows.
- Use database transactions or PostgreSQL functions when one logical change spans multiple Supabase tables.
- For cross-service workflows such as Razorpay to Supabase order/payment updates, prefer explicit state machines with compensating actions and observable state.
- Avoid dual writes unless an outbox/inbox or equivalent consistency mechanism exists.
- Protect schema migrations with rollback or forward-fix notes and compatibility checks.
- Treat `supabase/000_reset.sql` and reset-generating scripts as destructive; never run them against shared or production projects without explicit approval.

## API and Contract Safety
- Preserve route parity during migrations, including public `/order/[branchId]/[tableNumber]`, `/receipt/[orderId]`, auth callbacks, dashboard routes, and `/api/v1/webhooks/razorpay`.
- Maintain status codes, payload shapes, auth semantics, pagination, filtering, sorting, error models, and idempotency semantics unless intentionally changed.
- For Razorpay webhooks, preserve raw-body signature verification and avoid logging raw provider payloads with sensitive data.
- Update OpenAPI/protobuf/GraphQL/tRPC/generated clients and contract tests when contracts change; none were detected at scaffold time.
- Do not silently break public QR order consumers, staff dashboards, Supabase RLS assumptions, or payment reconciliation.

## AI and LLM System Safety
- No LLM workflows were detected. If added, version prompts, model settings, tool schemas, eval datasets, and handoff contracts.
- Use strict JSON schemas or typed contracts for tool calls and agent handoffs.
- Isolate private agent state from user-visible or tenant-visible data.
- Mock external LLMs in tests unless an explicit live-eval command exists.
- Add rate limits, retries with backoff, circuit breakers, token/cost budgets, and privacy filters.
- Log model/provider metadata without logging sensitive prompt content, secrets, customer data, or tenant-private context.
- Treat prompts, retrieved documents, and tool outputs as untrusted input.

## Observability Standards
- Prefer structured logs over ad hoc console output for server routes, webhooks, background work, and future integrations.
- Include request IDs, trace IDs, span IDs, job IDs, tenant/org IDs, branch IDs, order IDs, and service/version attributes where safe.
- Use OpenTelemetry semantic conventions when present or practical.
- Correlate logs, metrics, traces, and errors across public ordering, staff workflows, Supabase writes, and payment webhooks.
- Do not log secrets, credentials, raw tokens, raw Razorpay payloads, full customer phone numbers, or sensitive user data.
- Add metrics/traces for new critical paths, background jobs, external calls, storage operations, realtime subscriptions, and future agent workflows.

## Security and Privacy
- Use zero trust for inputs, files, prompts, webhook bodies, route params, Supabase rows, storage paths, and tool outputs.
- Validate at boundaries with Zod, database constraints, RLS, and provider signature checks.
- Enforce least privilege: browser code uses anon clients, server-only code may use service role only when necessary, and RLS must remain the main tenant boundary.
- Keep secrets in approved environment mechanisms such as `.env.local`, Supabase/Vercel/Netlify settings, or a secret manager.
- Never hardcode credentials, service-role keys, webhook secrets, or private provider tokens.
- Consider authn/authz, injection, SSRF, XSS, CSRF, deserialization, path traversal, supply chain, storage abuse, public-route abuse, and prompt injection risks.
- Treat demo seed credentials and hardcoded public tokens in scripts as non-production only and review before reuse.

## DevOps and IaC Guardrails
- Treat infrastructure, deployment, Supabase SQL, RLS, storage policies, and production environment variables as high blast-radius.
- Default to read-only review for production infrastructure and shared Supabase projects.
- Never apply, destroy, provision, reset, or mutate production infrastructure without explicit human approval.
- Always inspect plan/diff/SQL before proposing infrastructure or schema changes.
- Protect remote state and locking if Terraform/OpenTofu or another IaC tool is introduced.
- Commit Terraform/OpenTofu provider lockfiles when used.
- Separate environments and privileges for local, preview, staging, and production.
- Document blast radius, rollback or forward-fix, drift, cost, and policy impact.

## Testing and Verification
- Prefer targeted checks first, then broader suites when risk warrants.
- Use existing commands: `npm run lint`, `npm run build`, and `npm run dev` for local manual testing. No `npm test` script was detected.
- Add regression tests for bug fixes when a test harness exists or when adding one is in scope.
- Mock external services by default, including Supabase, Razorpay, email/OAuth, and any future LLM providers.
- Verify UI with screenshots or browser checks when UI changes are made.
- Verify SQL/RLS changes with safe local or staging checks before production use; never run destructive reset files casually.
- Verify IaC with fmt/validate/plan or equivalent read-only checks if IaC is introduced.
- If tests cannot run, state why and provide the closest completed verification.

## Debugging Protocol
- Reproduce before fixing when possible.
- Form multiple hypotheses before editing.
- Use tests, logs, traces, debuggers, browser checks, SQL explains, or minimal probes to isolate cause.
- Remove temporary instrumentation before completion unless intentionally retained.
- Fix root causes, not symptoms.
- For realtime/order/payment issues, trace the full state path from route/UI event to Supabase write, RLS policy, subscription update, and rendered state.

## Completion Checklist
- Files changed reviewed.
- Tests/checks run or explicitly skipped with reason.
- Docs/contracts updated when behavior changes.
- Security and observability considered.
- No unrelated dependency or lockfile churn.
- Public routes, auth/RLS, payment, and data consistency implications reviewed when touched.
- Final response lists evidence, not vibes.

## Skill Index
- `architecture`: Use for system design, module boundaries, clean architecture, and route/component/data ownership decisions.
- `api-contracts`: Use for REST/webhook/public route changes, contract compatibility, and generated-client/schema updates.
- `multi-agent-systems`: Use before adding LLMs, RAG, tool calling, evals, or multi-agent workflows.
- `data-state`: Use for Supabase/Postgres schema, RLS, migrations, realtime, storage, payments, queues, caches, and state transitions.
- `devops-iac`: Use for deployment, CI/CD, environment config, Supabase project operations, Terraform/OpenTofu/Pulumi/Kubernetes/Helm if introduced.
- `testing-quality`: Use for test strategy, regression coverage, CI gates, fixtures, and verification plans.
- `observability`: Use for logging, metrics, tracing, alerting, diagnostics, and telemetry redaction.
- `security-privacy`: Use for auth, RLS, public routes, secrets, dependency/container risk, privacy, and prompt-injection review.
- `dependency-management`: Use before changing packages, lockfiles, generated clients, or package-manager metadata.
- `monorepo`: Use if the repo grows into workspaces or cross-package boundaries; currently conditional.
- `onboarding-docs`: Use when updating human/AI onboarding docs, setup guides, maps, or runbooks.
- `frontend-ux`: Use for Next.js UI, shadcn-style components, accessibility, responsive behavior, and browser/screenshot verification.

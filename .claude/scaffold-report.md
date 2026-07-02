# Claude Scaffold Report

## Timestamp
- Generated: 2026-05-24T08:14:56Z

## Files Inspected
- Repository/root state: `pwd`, `git status --short`, `ls -la`, `find . -maxdepth 2 -type d`.
- Existing AI config search: `CLAUDE.md`, `CLAUDE.local.md`, `AGENTS.md`, `.claude/`, `.cursor/rules/`, `.cursorrules`, `.windsurfrules`, `.github/copilot-instructions.md`.
- Human docs: `README.md`, `guide.md`, `appdev.md`, `react_application.md`.
- Package/config: `package.json`, `package-lock.json`, `tsconfig.json`, `next.config.ts`, `eslint.config.mjs`, `components.json`, `.env.example`.
- Source: `src/app`, `src/components`, `src/hooks`, `src/lib`, `src/stores`, `src/middleware.ts`.
- API/security/data: `src/app/api/v1/webhooks/razorpay/route.ts`, `src/lib/supabase/client.ts`, `src/lib/supabase/server.ts`, `src/lib/supabase/types.ts`, `src/lib/validations.ts`, `src/hooks/use-realtime-orders.ts`.
- Data/scripts: `supabase/000_reset.sql`, `supabase/001_setup.sql`, `supabase/002_seed_data.sql`, `scripts/seed-test-data.mjs`, `scripts/write_sql.py`, `scripts/write_sql_v2.py`.
- User-local skills directory: `/Users/prashant/.gemini/antigravity/skills` was listed by directory name only.

## Stack Detected
- Next.js 16 App Router, React 19, TypeScript strict mode, npm, Tailwind CSS v4, shadcn-style UI, lucide-react, Framer Motion.
- Supabase/PostgreSQL/Auth/Realtime/Storage with SQL schema, RLS policies, triggers, indexes, storage policies, and realtime publication updates.
- State/data libraries: TanStack React Query, TanStack React Table, Zustand, React Hook Form, Zod.
- Payments: UPI QR and optional Razorpay webhook route.
- Observability: no configured provider detected; ad hoc `console.error` exists.
- AI/LLM: no provider, prompt, RAG, vector, eval, or agent code detected.
- IaC/CI: no Terraform/OpenTofu/Pulumi/Kubernetes/Helm/Docker/GitHub Actions/GitLab CI detected.

## Existing AI Instructions Found
- No repository-local `CLAUDE.md`, `.claude/`, `AGENTS.md`, `.cursor/rules/`, `.cursorrules`, `.windsurfrules`, or `.github/copilot-instructions.md` was found during local search.
- The user message supplied AGENTS-style instructions for `/graphify`; no `AGENTS.md` file was present in the worktree at scaffold time.
- User-local skills directory exists at `/Users/prashant/.gemini/antigravity/skills`. Directory names listed: `agent-skills`, `antigravity-awesome-skills`, `antigravity-skills`, `awesome-agent-skills`, `awesome-claude-code`, `awesome-claude-code-and-skills`, `awesome-llm-skills`, `platform-design-skills`, `skills`, `ui-skills`, `ui-ux-pro-max-skill`. No local skill files were copied or executed.

## Files Created or Updated
- Created `CLAUDE.md`.
- Created `.claude/project-map.md`.
- Created `.claude/scaffold-report.md`.
- Created skills:
  - `.claude/skills/architecture/SKILL.md`
  - `.claude/skills/api-contracts/SKILL.md`
  - `.claude/skills/multi-agent-systems/SKILL.md`
  - `.claude/skills/data-state/SKILL.md`
  - `.claude/skills/devops-iac/SKILL.md`
  - `.claude/skills/testing-quality/SKILL.md`
  - `.claude/skills/observability/SKILL.md`
  - `.claude/skills/security-privacy/SKILL.md`
  - `.claude/skills/dependency-management/SKILL.md`
  - `.claude/skills/monorepo/SKILL.md`
  - `.claude/skills/onboarding-docs/SKILL.md`
  - `.claude/skills/frontend-ux/SKILL.md`
- Created agents:
  - `.claude/agents/code-reviewer.md`
  - `.claude/agents/test-runner.md`
  - `.claude/agents/security-reviewer.md`
  - `.claude/agents/iac-reviewer.md`
  - `.claude/agents/monorepo-cartographer.md`

## Conflicts or Preserved Legacy Instructions
- No existing repository-local Claude scaffold was overwritten.
- `README.md` still contains create-next-app boilerplate; preserved unchanged.
- `guide.md` describes current CAPP setup and was preserved unchanged.
- `appdev.md` is a planning blueprint and mentions some planned tools that conflict with current evidence, such as pnpm, Next.js 15, Vitest, Playwright, Husky, and GitHub Actions. Generated guidance follows current repository evidence: npm, Next.js 16, no test script, and no CI detected.
- No `.cursor/rules` directory was present, so no Cursor compatibility rule was added.
- No `.github/copilot-instructions.md` was present.

## Unknowns
- Production hosting provider and deployment process are UNKNOWN.
- CI provider and required checks are UNKNOWN.
- Database migration process beyond manual Supabase SQL Editor instructions is UNKNOWN.
- Monitoring, alerting, tracing, and structured logging provider are UNKNOWN.
- Automated test strategy is UNKNOWN.
- Team ownership and service boundaries are UNKNOWN.
- Whether hardcoded demo seed credentials/tokens are acceptable long term is UNKNOWN.

## Verification Performed
- Read/listed existing files before writing.
- Created directories under `.claude/skills` and `.claude/agents`.
- Read back generated root files with `sed -n`: `CLAUDE.md`, `.claude/project-map.md`, and `.claude/scaffold-report.md`.
- Listed generated files with `find .claude -type f | sort`.
- Counted generated file lengths with `wc -l CLAUDE.md .claude/skills/*/SKILL.md .claude/agents/*.md .claude/project-map.md .claude/scaffold-report.md`; `CLAUDE.md` is 162 lines, within the requested 120-220 line target.
- Ran a Node-based read-back validator over all 20 generated files. It confirmed:
  - `CLAUDE.md` contains the required top-level sections.
  - All 12 skills exist at `.claude/skills/<name>/SKILL.md`.
  - All skill files have `name` and `description` frontmatter.
  - All skills contain When to Use, Required Discovery, Non-Negotiable Rules, Workflow, Verification, and Common Failure Modes sections.
  - All 5 optional agents have `name`, `description`, and `tools` frontmatter.
  - `.claude/project-map.md` and `.claude/scaffold-report.md` exist.
  - No flat `.claude/skills/*.md` files exist.
  - Generated files do not contain obvious secret patterns.
- Searched for Markdown lint/format config with `rg --files | rg '(markdownlint|\.prettierrc|prettier\.config|biome\.json|dprint|remark|mdformat)'`; none was found.
- Ran `npm run lint`; it failed on pre-existing application lint issues outside the generated scaffold, including `@typescript-eslint/no-explicit-any`, unused imports, React Hook/React Compiler warnings, and image lint warnings.
- Ran `git status --short`; only `?? .claude/` and `?? CLAUDE.md` were shown.
- Ran `git diff --stat`; no tracked file modifications were shown because all scaffold files are newly untracked.

## Recommended Next Steps
- Replace the boilerplate `README.md` with a short CAPP-specific setup guide, or point it to `guide.md` and `.claude/project-map.md`.
- Add a non-destructive database migration workflow with clear local/staging/production instructions.
- Add automated tests for auth/RLS-sensitive flows, public QR ordering, order/payment state transitions, and Razorpay webhook idempotency.
- Add CI that runs `npm run lint` and `npm run build`.
- Add structured server logging and payment/realtime diagnostics with redaction.
- Triage the existing lint failures before using lint as a blocking CI gate.
- Review `scripts/seed-test-data.mjs` for hardcoded endpoint/token hygiene before broader use.

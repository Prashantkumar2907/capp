---
name: devops-iac
description: Use for deployment, CI/CD, environments, Supabase project operations, secrets, and any Terraform/OpenTofu/Pulumi/Kubernetes/Helm/IaC work introduced to CAPP.
---

# DevOps and IaC Skill

## When to Use
- Use for deployment, environment variables, CI/CD, Supabase project setup, Vercel/Netlify configuration, schema rollout plans, and any future IaC.
- Use when touching production-like resources, build settings, secrets, database reset/setup files, or payment webhook URLs.
- Current state: no Terraform/OpenTofu/Pulumi/Kubernetes/Helm/Docker/GitHub Actions files were detected. Docs mention Vercel and Netlify.

## Required Discovery
- Read `package.json`, `package-lock.json`, `guide.md`, `.env.example`, `next.config.ts`, and relevant Supabase SQL.
- List deployment/IaC files before editing. At scaffold time, none were detected besides documentation and Supabase SQL.
- Identify environment names, owners, and credentials. If not in repo, mark UNKNOWN.
- Check whether remote state, locking, policy-as-code, or CI gates exist. At scaffold time, these are UNKNOWN or not detected.

## Non-Negotiable Rules
- Default to read-only review for production infrastructure and shared Supabase projects.
- Never apply, destroy, provision, reset, or mutate production infrastructure without explicit human approval.
- Always inspect plans, diffs, SQL, or deployment previews before proposing high-blast-radius changes.
- Protect state files, locks, secrets, webhook secrets, service-role keys, and provider credentials.
- Separate local, preview, staging, and production environments and privileges.
- Do not run destructive SQL reset scripts casually.

## Workflow
1. Classify the surface:
   - App build/runtime.
   - Supabase schema/RLS/storage/realtime.
   - CI/CD.
   - Hosting config.
   - IaC, if introduced.
2. Build blast-radius notes:
   - Affected environment.
   - Resources changed.
   - Data risk.
   - Downtime risk.
   - Cost impact.
   - Rollback or forward-fix.
3. For Terraform/OpenTofu, if introduced:
   - Run fmt and validate.
   - Inspect plan before apply.
   - Protect remote state and locking.
   - Commit provider lockfiles.
4. For Kubernetes/Helm/Kustomize, if introduced:
   - Render manifests before applying.
   - Check secrets, RBAC, probes, resource limits, and namespace/environment separation.
5. For CI/CD:
   - Keep secrets in CI secret stores.
   - Avoid logging tokens or environment values.
   - Prefer least-privilege deploy tokens.
6. For Supabase:
   - Verify target project before running SQL.
   - Review RLS/storage policies and realtime publications.
   - Treat reset scripts as local-only unless explicitly approved.

## Verification
- Run safe formatting/validation commands when configured.
- For this repo, use `npm run build` for deployment-readiness and `npm run lint` for code quality.
- For SQL, use safe local/staging validation and record the target environment.
- For IaC, run read-only plan/diff and record that no apply/destroy occurred.
- Confirm environment variable names match `.env.example` without exposing values.

## Common Failure Modes
- Applying changes to the wrong Supabase project.
- Running `supabase/000_reset.sql` or generated reset SQL on shared data.
- Changing deployment provider settings without recording rollback.
- Leaking `SUPABASE_SERVICE_ROLE_KEY` or `RAZORPAY_WEBHOOK_SECRET` in logs.
- Mixing preview and production secrets.
- Treating docs-only deployment guidance as proof that CI/CD exists.

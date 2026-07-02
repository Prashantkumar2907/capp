---
name: security-privacy
description: Use for CAPP security review, privacy, secrets, Supabase RLS/Auth, public QR ordering, Razorpay webhooks, supply chain, and prompt injection defenses.
---

# Security and Privacy Skill

## When to Use
- Use for auth, authorization, RLS, public routes, webhooks, file uploads, storage policies, secrets, dependency changes, and any AI/prompt/tooling feature.
- Use before changing staff roles, customer ordering, payments, Supabase service-role usage, or SQL policies.
- Use when reviewing `scripts/seed-test-data.mjs`, reset SQL, or deployment docs for production readiness.

## Required Discovery
- Read `src/middleware.ts`, `src/lib/supabase/server.ts`, `src/lib/supabase/client.ts`, `src/app/api/v1/webhooks/razorpay/route.ts`, and affected routes.
- Read RLS/storage policy sections in `supabase/001_setup.sql`.
- Check `.env.example` for required secret names without reading secret values from `.env.local`.
- Search for hardcoded credentials/tokens and document paths only, never values.
- Check dependency/security tooling in `package.json` and CI. None was detected at scaffold time.

## Non-Negotiable Rules
- Threat model proportional to risk before high-impact changes.
- Validate all inputs at boundaries: route params, forms, webhooks, files, Supabase rows, and tool outputs.
- Preserve authn/authz and RLS semantics unless the change explicitly updates the security model.
- Keep service-role usage server-only and minimal.
- Never hardcode private credentials, service-role keys, webhook secrets, or provider tokens.
- Redact sensitive telemetry.
- For future AI features, defend against prompt injection, tool abuse, and data exfiltration.

## Workflow
1. Identify assets:
   - Tenant/org/branch data.
   - Staff roles and permissions.
   - Orders, payments, customer contact data, UPI/Razorpay metadata.
   - Supabase storage objects.
   - Secrets and environment variables.
2. Identify trust boundaries:
   - Public customer QR routes.
   - Authenticated dashboard routes.
   - Supabase browser client and RLS.
   - Server route handlers and service-role code.
   - Razorpay webhook ingress.
3. Review risks:
   - Injection, SSRF, XSS, CSRF, deserialization, path traversal.
   - Broken access control or RLS bypass.
   - Storage abuse and unsafe file types.
   - Supply chain and dependency risk.
   - Secret leakage in logs, scripts, or generated docs.
4. Apply secure defaults:
   - Least privilege.
   - Explicit allowlists.
   - Signature verification for webhooks.
   - File size/type restrictions.
   - Idempotency and replay handling.
5. For dependency/container scanning, use configured tools if present; otherwise mark UNKNOWN and recommend adding tooling.

## Verification
- Run `npm run lint` for code changes.
- Run `npm run build` for route/server-client boundary changes.
- Perform role/RLS checks for affected tables.
- Verify webhook signature rejection and accepted paths with safe mocked payloads when possible.
- Search generated files for obvious secret patterns before final response.
- Document any security gaps as deferred, not silently ignored.

## Common Failure Modes
- Assuming middleware protects all sensitive data while public routes and Supabase RLS still matter.
- Exposing service-role logic through client imports.
- Weakening RLS for convenience.
- Accepting webhooks without replay/idempotency thinking.
- Logging raw tokens, full phone numbers, or provider payloads.
- Adding an AI tool that can mutate payments/orders without approval gates.

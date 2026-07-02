---
name: dependency-management
description: Use before changing CAPP packages, npm scripts, lockfiles, generated clients, Supabase types, or package-manager metadata.
---

# Dependency Management Skill

## When to Use
- Use before adding, removing, or upgrading dependencies or devDependencies.
- Use before modifying `package.json`, `package-lock.json`, `next.config.ts`, `eslint.config.mjs`, `tsconfig.json`, `components.json`, or generated clients/types.
- Use when regenerating Supabase types or client code from schema.

## Required Discovery
- Read `package.json` and `package-lock.json`.
- Confirm the package manager: npm is detected because `package-lock.json` exists and no pnpm/yarn/bun lockfile was detected.
- Check existing libraries before adding a new one: Next.js, React, Supabase, React Query, Zustand, Zod, React Hook Form, Tailwind, shadcn-style UI, lucide-react, Framer Motion, Recharts, qrcode.react.
- Search for the capability in existing code before adding a package.
- Check CI/dependency scanning. No configured scanning was detected at scaffold time.

## Non-Negotiable Rules
- Use npm only unless the user explicitly approves a package-manager switch.
- Respect `package-lock.json`.
- Avoid rogue package bumps and unrelated lockfile churn.
- Explain every dependency change: why, scope, direct/transitive impact, lockfile impact, and verification.
- Separate security upgrades from feature work unless the user asks to combine them.
- Regenerate clients only from the source schema, not from guessed shapes.
- Do not change package-manager metadata unless required.

## Workflow
1. Decide if a dependency is necessary. Prefer built-in Next.js, current dependencies, or small local code when appropriate.
2. Check compatibility with Next.js 16, React 19, TypeScript strict mode, and Tailwind CSS v4.
3. For installs, use npm and expect `package-lock.json` to change.
4. For security updates, isolate the minimal package set and read changelogs/advisories when internet access is available.
5. For generated clients/types:
   - Identify the source schema.
   - Regenerate using the repo's configured command if present.
   - If no command exists, document UNKNOWN and do not hand-edit generated output casually.
6. Review `git diff` for unrelated lockfile changes.

## Verification
- Run `npm run lint`.
- Run `npm run build` after runtime dependency or config changes.
- Run dependency/security checks if configured; none were detected at scaffold time.
- Inspect `git diff -- package.json package-lock.json`.
- Confirm imports compile and no server-only package is pulled into browser bundles accidentally.

## Common Failure Modes
- Following old planning docs that mention pnpm while the actual repo uses npm.
- Installing a package for a feature already covered by current dependencies.
- Accepting broad transitive updates from an unrelated install.
- Hand-editing lockfiles.
- Regenerating types from stale schema or modifying generated output manually.

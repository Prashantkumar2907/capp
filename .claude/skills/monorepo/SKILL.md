---
name: monorepo
description: Conditional skill for workspace detection, ownership, affected commands, shared library impact, and path-specific guidance if CAPP grows beyond a single Next.js app.
---

# Monorepo Skill

## When to Use
- Use if workspaces, multiple apps/services/packages, shared libraries, or path-specific `CLAUDE.md` files are introduced.
- Use for cross-package changes, shared library edits, service boundary mapping, or affected-graph analysis.
- Current state: this repo appears to be a single npm package, not a monorepo. No npm/yarn/pnpm workspaces, Nx, Turborepo, Bazel, Pants, or package directories were detected.

## Required Discovery
- Read root `package.json` for `workspaces` or task runner config.
- Search for `turbo.json`, `nx.json`, `pnpm-workspace.yaml`, `lerna.json`, `rush.json`, `bazel`, `pants.toml`, and package-level manifests.
- Map apps, packages, services, libraries, infra, charts, modules, owners, and service boundaries.
- Identify path-specific instructions if any are added later.

## Non-Negotiable Rules
- Do not run global commands when targeted affected commands exist.
- Respect ownership and package boundaries.
- Avoid editing shared libraries for a single feature without checking all consumers.
- Keep versioning and release impact explicit for cross-package changes.
- Do not invent workspace commands.

## Workflow
1. Detect workspace tool and package graph.
2. Identify the smallest affected package/service/app.
3. Read local docs and path-specific instructions.
4. Check consumers before changing shared libraries.
5. Use affected graph commands when available.
6. Run service-local tests first, then broader affected checks.
7. Propose subproject `CLAUDE.md` guidance when repeated local patterns differ from the root.

## Verification
- Run affected graph commands if configured.
- Run package-local tests/lint/build before global checks.
- Inspect changed package manifests and lockfiles.
- Confirm no unrelated packages changed.
- If no monorepo tool exists, state that this skill is conditional and use root npm commands.

## Common Failure Modes
- Treating the whole repo as one deployable unit after workspaces are introduced.
- Changing shared types or UI components without checking every consumer.
- Running slow global commands instead of available targeted checks.
- Mixing package managers across workspaces.
- Creating path-specific guidance that contradicts root safety rules.

---
name: testing
description: Use for CAPP node:test, API contract, DB verification, Playwright UI, route readiness, and verification workflows.
---

# Testing

## When to use this skill
Use before adding tests, changing test commands, fixing failures, or modifying code that affects validation, RLS, auth, ordering, payments, performance budgets, route states, or UI flows.

## Quick reference
| Task | Command |
| --- | --- |
| Unit | `npm run test` |
| API contracts | `npm run test:api` |
| UI Playwright | `npm run test:ui` |
| DB verify | `npm run db:verify` |
| Full local gate | `npm run verify` |
| CI-style gate | `npm run verify:ci` |
| Single unit/API file | `node --import tsx --test tests/unit/order-status.test.ts` |
| Single UI file | `npx playwright test tests/ui/public-order.spec.ts` |

## Test placement
Unit tests live under `tests/unit`. API contract and smoke tests live under `tests/api`. Playwright specs live under `tests/ui`.

Playwright config in `playwright.config.ts` runs desktop, tablet, and mobile Chromium projects, starts `npm run dev -- --webpack`, blocks service workers, and records trace on first retry.

See `references/test-matrix.md` for coverage by risk area.

## What must be tested
- New or changed status transitions, role matrices, validation schemas, utilities, performance budgets, RLS policies, or docs readiness need unit tests.
- API handlers need contract tests for invalid payloads and trust boundaries before database work.
- Public QR, duplicate-submit, responsive, reduced-motion, and critical route loading states need Playwright coverage when changed.
- Database schema/RLS changes need `tests/api/db.verify.ts` or SQL-reading unit tests.

## Do not
- Do not rely only on happy-path UI tests for security or trust boundaries.
- Do not run DB migration/verify against non-disposable databases unless env safeguards are understood.
- Do not add tests that require real secrets in the repository.
- Do not skip `npm run typecheck` and `npm run lint` for typed route/service changes.

---
name: performance
description: Use for CAPP critical route budgets, duplicate-fetch audits, API latency, pagination, image budgets, caching, and indexed hot paths.
---

# Performance

## When to use this skill
Use for profiling, optimizing, adding critical routes, changing data fetching, adding images, changing pagination, reducing duplicate calls, or auditing network/rendering behavior.

## Quick reference
| Source | Purpose |
| --- | --- |
| `src/lib/performance/budgets.ts` | Machine-readable route budgets |
| `docs/performance.md` | Human route budget guide |
| `tests/unit/performance-budgets.test.ts` | Budget/index/trust-boundary gate |
| `playwright.config.ts` | Desktop/tablet/mobile UI coverage |
| `supabase/01_schema.sql` | Required hot-path indexes |

## Budget rules
Critical routes declare route pattern, persona, max initial JS KB, API p95 budget, image KB budget, duplicate fetch allowance, mutation requests per intent, UX state requirements, cache key, hot indexes, trust boundaries, and viewports.

Every current budget allows zero duplicate fetches. Mutating workflows generally allow one mutation request per user intent.

See `references/budgets.md` for route IDs and budgets.

## Data and rendering
- Prefer narrow Supabase selects and branch/date filters.
- Keep operational lists paginated or range-limited before adding filters to large data sets.
- Cache public menu responses as in `src/app/api/public/menu/route.ts`.
- Use skeletons matching final layout to avoid layout shift.
- Use image fallbacks and keep dish/media payloads small.

## Do not
- Do not add duplicate fetches for the same branch/table/query key.
- Do not submit prices or totals from the client to avoid recalculation.
- Do not add layout-triggering animations on critical route transitions.
- Do not add critical route indexes without updating tests/docs.

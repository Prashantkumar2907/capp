---
name: commit-messages
description: Use for CAPP commit messages and PR descriptions based on the repository's existing Conventional Commit style history.
---

# Commit Messages

## When to use this skill
Use when writing a commit message, squashing commits, preparing a PR summary, or choosing a scope for a change.

## Quick reference
Recent history uses concise Conventional Commit style:

| Type | Evidence in history |
| --- | --- |
| `feat` | `feat: add platform admin subscription console` |
| `fix` | `fix: harden public ordering performance` |
| `docs` | `docs: document platform admin operations` |
| `chore` | `chore: resolve fast-uri audit advisory` |
| `perf` | `perf: add indexed hot paths and RLS hardening` |

## Format
Use:

```text
<type>: <imperative summary>
```

Keep the subject short, lower-case after the colon unless naming a proper noun, and focused on the user-visible or maintenance outcome.

Optional scopes may be useful when the changed area is clear: `api`, `auth`, `ui`, `db`, `docs`, `tests`, `public-order`, `platform`, `payments`, `menu`.

See `references/pr-template.md` for PR summary shape.

## Examples
Good:

- `fix: harden public ordering performance`
- `perf: add indexed hot paths and RLS hardening`
- `docs: document platform admin operations`

Bad:

- `updates`
- `fix stuff`
- `wip`
- `feat: change api and redesign dashboard and reset database`

## Do not
- Do not claim verification that was not run.
- Do not mix unrelated route/API/database changes into one vague commit.
- Do not include issue logs, secrets, env values, screenshots, or generated test artifacts in commit text.
- Do not force-push protected branches.

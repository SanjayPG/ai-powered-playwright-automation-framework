# pw-automation-lab

A small Playwright + TypeScript automation framework used as the **Part B
companion repo** for the *"AI for SDETs with Claude Code"* video series. It's
the real-world testbed: every episode takes that episode's Claude Code
building block — `CLAUDE.md`, slash commands, skills, subagents, MCP — and
applies it here, against a repo you'd actually maintain.

This is not only a `/review` exercise. Across the series this repo picks up
the full toolkit:

| Building block | What it does here |
|---|---|
| `CLAUDE.md` | Automation standards (selectors, waits, assertions, Page Objects, …) written down as project rules |
| Slash commands | `/review` — AI code review against those standards |
| Skills | Standards move into `.claude/skills/automation-standards/` so they load only when needed |
| Subagents | `/review` fans out — one worker per changed spec, plus a dedicated secret-scanner — and merges one report |
| MCP | A Playwright MCP server so Claude can drive a real browser to verify a review fix |
| Agents on generated output | Specs get scaffolded straight from the companion `tc-generator` repo's test cases, one at a time and then in bulk |

> ⚠️ **Some specs in `tests/` intentionally break this project's automation
> standards.** They are the material for the `/review` exercises in the series —
> `tests/checkout.spec.ts`, `tests/e2e-purchase.spec.ts`, and `tests/smoke.spec.ts`.
> Do not copy them as examples. The clean references are `tests/login.spec.ts`,
> `tests/inventory.spec.ts`, and `tests/cart.spec.ts`.

## Stack

- `@playwright/test` (chromium only)
- TypeScript, Page Object Model, custom fixtures
- App under test: [saucedemo.com](https://www.saucedemo.com)

## Setup

```bash
npm install
npx playwright install chromium
npm test            # all specs green (smoke skips 1)
npm run test:headed # watch it run
npm run report      # open the HTML report
```

## Layout

```
.claude/     commands, and later skills — the Claude Code building blocks
pages/       Page Objects (login, inventory, cart, checkout)
fixtures/    test-options.ts — page-object fixtures + a logged-in-user fixture
test-data/   JSON test data (users, checkout details)
tests/       *.spec.ts — 3 clean, 3 with planted violations
```

## Automation standards

The coding standards these specs are reviewed against (selectors, no hard waits,
one behaviour per test, no shared state, Page Objects, data/config not literals,
no orphan `.only`/`.skip`, naming, fixtures own setup) live in `CLAUDE.md` and
are enforced by the `/review` command.

## Companion project

This repo pairs with `tc-generator` — an AI test-case generator that reads
work items from Azure DevOps and writes test cases out. The same five Claude
Code primitives (`CLAUDE.md`, commands, skills, subagents, MCP) are built there
first each episode, then brought over here. See the series episode map for the
full arc.

# pw-automation-lab

A small Playwright + TypeScript automation framework used as the **Part B
companion repo** for the *"AI for SDETs with Claude Code"* video series. Each
episode applies that episode's Claude Code building block to this repo, with
`/review` (code review against the team's automation standards) as the running
task.

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
pages/       Page Objects (login, inventory, cart, checkout)
fixtures/    test-options.ts — page-object fixtures + a logged-in-user fixture
test-data/   JSON test data (users, checkout details)
tests/       *.spec.ts — 3 clean, 3 with planted violations
```

## Automation standards

The coding standards these specs are reviewed against (selectors, no hard waits,
one behaviour per test, no shared state, Page Objects, data/config not literals,
no orphan `.only`/`.skip`, naming, fixtures own setup) are added to this repo as
`CLAUDE.md` during **Episode 1** of the series, and move into
`.claude/skills/automation-standards/` in **Episode 3**. Until then, see the
series notes.

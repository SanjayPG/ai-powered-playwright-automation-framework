# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

A small Playwright + TypeScript e2e framework testing [saucedemo.com](https://www.saucedemo.com),
used as the companion repo for the "AI for SDETs with Claude Code" series. The
running exercise is `/review`: reviewing specs against the team's automation
standards.

**Some specs are broken on purpose.** `tests/checkout.spec.ts`,
`tests/e2e-purchase.spec.ts`, and `tests/smoke.spec.ts` deliberately violate the
automation standards — they are the `/review` exercise material and carry inline
`// (A)`, `// (B)`… markers for each planted violation. Do not "fix" them, lint
them, or copy their patterns unless explicitly asked. The clean references are
`tests/login.spec.ts`, `tests/inventory.spec.ts`, `tests/cart.spec.ts`.

## Commands

```bash
npm install
npx playwright install chromium   # first run only

npm test                          # run every spec (chromium only)
npm run test:headed               # headed
npm run test:ui                   # Playwright UI mode
npm run report                    # open the HTML report

npx playwright test tests/login.spec.ts          # one file
npx playwright test -g "locked-out user"         # by test title
npx tsc --noEmit                                 # typecheck (no dedicated lint script)
```

`BASE_URL` overrides the app URL (see `.env.example`); default is
`https://www.saucedemo.com`. There is no lint step. `main` is the baseline
branch.

## Architecture

**Fixtures are the entry point.** Specs import `test` and `expect` from
`fixtures/test-options.ts`, never from `@playwright/test` directly (importing
from `@playwright/test` is itself a standards violation — it bypasses the Page
Objects). `test-options.ts` extends the base test with one fixture per Page
Object plus `standardUserInventory` — a composed fixture that performs a UI login
as the standard user and hands back a ready `InventoryPage`. Auth and setup live
in fixtures, not in test bodies.

**Page Objects** (`pages/`) all extend `BasePage`, which holds the `Page`
reference. Each exposes:
- Locators as `private readonly` class fields, resolved with `getByTestId` —
  SauceDemo exposes `data-test="..."` hooks and `playwright.config.ts` sets
  `testIdAttribute: 'data-test'`.
- Intent methods (`login`, `addToCart`, `checkout`…) and a few assertion helpers
  (`expectError`, `expectOrderComplete`).
- Specs own the flow and the assertions; Page Objects own the selectors.

**Per-row actions** use the `InventoryPage.itemCard(name)` pattern —
`getByTestId('inventory-item').filter({ hasText: name })` then a role-scoped
locator inside it — instead of positional selectors like `.nth(1)`.

**Test data** is JSON in `test-data/` (`users.json`, `checkout.json`), imported
directly (`resolveJsonModule`). No credentials or URLs inline in specs.

Config: `fullyParallel: true`, chromium-only project, retries/workers only under
`CI`, trace on first retry, screenshot on failure.

#Code review

For anything about spec or page-object quality, use the automation-standards
skill.
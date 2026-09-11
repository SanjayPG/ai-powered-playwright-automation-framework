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

## Automation standards

Every spec and page object in this repo is reviewed against these standards.
Each one: the rule, why it matters, and a bad → good example.

### S1. Selectors
`getByRole` / `getByLabel` / `getByTestId` only, in that order. No XPath. No
structural CSS (`nth-child`, long `.nth()` chains, `div > div > button`).
*Why:* structural selectors break on markup changes unrelated to behaviour.
```ts
// bad
page.locator('.cart_footer button').nth(1)
// good
page.getByRole('button', { name: 'Checkout' })
```

### S2. No hard waits
Never `page.waitForTimeout()`. Rely on web-first assertions and auto-waiting
actions; for a genuine condition use `expect.poll`, `waitForURL`, or
`waitForResponse`.
*Why:* fixed sleeps are simultaneously flaky and slow.
```ts
// bad
await page.waitForTimeout(3000);
// good
await expect(page.getByTestId('complete-header')).toBeVisible();
```

### S3. Every test asserts
At least one `await expect(...)` per test. Prefer web-first assertions
(`await expect(locator)...`) over `expect(await ...)`.
*Why:* a test with no assertion only proves nothing threw.
```ts
// bad
test('smoke', async ({ page }) => { await page.goto('/'); await page.click('#x'); });
// good
test('cart opens', async ({ cartPage }) => {
  await expect(cartPage.itemNames()).toHaveCount(1);
});
```

### S4. One behaviour per test
No login + checkout + logout monoliths. Shared setup goes in `beforeEach` or a
fixture.
*Why:* focused tests localise failures and run independently.
```ts
// bad
test('purchase flow', async () => { /* login, add, checkout, logout — 40 lines */ });
// good  — three focused tests + a logged-in fixture
test('checkout succeeds with valid details', async ({ standardUserInventory }) => { ... });
```

### S5. No shared state between tests
No module-level `let`. No test that depends on another running first. No
`test.describe.configure({ mode: 'serial' })` used to prop up order-dependent
tests.
*Why:* order-dependent tests fail at random under `fullyParallel` and sharding.
```ts
// bad
let lastAddedProduct = '';
test('a', async () => { lastAddedProduct = 'Backpack'; ... });
test('b', async () => { expect(lastAddedProduct).toBe('Backpack'); });
// good — each test sets up its own data
```

### S6. Page Objects for all interaction
Specs call page-object methods and hold the flow and the assertions. No raw
`page.locator(...)` / `page.fill(...)` in a spec.
*Why:* keeps selectors in one place; specs read as intent.
```ts
// bad
await page.locator('[data-test="add-to-cart-sauce-labs-backpack"]').click();
// good
await inventoryPage.addToCart('Sauce Labs Backpack');
```

### S7. Data and config, not literals
Test data from `test-data/*.json` or fixtures. Credentials and base URL from
config / env. Navigate with relative paths (`page.goto('/')`).
*Why:* literals scattered across specs cannot be changed safely, and inline
credentials are a security problem.
```ts
// bad
await page.goto('https://www.saucedemo.com');
await page.fill('#password', 'secret_sauce');
// good
await page.goto('/');
await loginPage.login(users.standard.username, users.standard.password);
```

### S8. No orphan `.only` / `.skip`
Never commit `test.only`. A `test.skip` needs a comment:
`// SKIP: <reason> — <ticket-url>`.
*Why:* `.only` disables the rest of the suite in CI; silent skips rot.
```ts
// bad
test.skip('cart persistence', async () => { /* TODO fix later */ });
// good
// SKIP: cart persistence flaky on SauceDemo — https://tracker/PROJ-123
test.skip('cart persistence', async () => { ... });
```

### S9. Naming
`describe` = feature or page. `test` title = the observable behaviour, present
tense. Files `*.spec.ts` under `tests/`.
*Why:* a failing test name should read as the broken behaviour.
```ts
// bad
test('checkout', ...)
// good
test('order completes with valid customer details', ...)
```

### S10. Fixtures own setup and teardown
Auth via a fixture (UI login or `storageState`). Anything a test creates, a
fixture or the test tears down.
*Why:* setup in the test body gets copy-pasted and drifts.
```ts
// bad — login steps repeated at the top of every test
// good
test('...', async ({ standardUserInventory }) => { /* already logged in */ });
```

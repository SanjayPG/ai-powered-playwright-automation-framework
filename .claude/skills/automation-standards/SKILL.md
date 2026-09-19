---
name: automation-standards
description: Playwright automation standards for this repo — selectors, waits,
  test isolation, Page Objects, data and config. Use when writing or reviewing
  specs or page objects.
allowed-tools: Read
---

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

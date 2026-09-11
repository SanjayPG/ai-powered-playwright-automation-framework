import { test, expect } from '../fixtures/test-options';

// (E) module-level mutable state shared between tests, propped up by serial mode
// so the order dependency doesn't blow up under fullyParallel.
test.describe.configure({ mode: 'serial' });

let lastAddedProduct = '';

test.describe('Purchase', () => {
  test('full purchase journey', async ({ page }) => {
    // (F) one test covering login + browse + cart + checkout + logout
    // (G) raw page.locator(...) in the spec instead of Page Objects
    await page.goto('/');
    await page.getByTestId('username').fill('standard_user');
    await page.getByTestId('password').fill('secret_sauce');
    await page.getByTestId('login-button').click();

    await page.locator('[data-test="add-to-cart-sauce-labs-backpack"]').click();
    lastAddedProduct = 'Sauce Labs Backpack';

    await page.locator('.shopping_cart_link').click();
    await page.locator('[data-test="checkout"]').click();
    await page.locator('[data-test="firstName"]').fill('Sam');
    await page.locator('[data-test="lastName"]').fill('Tester');
    await page.locator('[data-test="postalCode"]').fill('560001');
    await page.locator('[data-test="continue"]').click();
    await page.locator('[data-test="finish"]').click();

    await expect(page.locator('[data-test="complete-header"]')).toHaveText(
      'Thank you for your order!',
    );

    await page.locator('#react-burger-menu-btn').click();
    await page.locator('#logout_sidebar_link').click();
    await expect(page.getByTestId('login-button')).toBeVisible();
  });

  test('remembers the product from the previous test', async () => {
    // depends entirely on the previous test having run and mutated shared state
    expect(lastAddedProduct).toBe('Sauce Labs Backpack');
  });
});

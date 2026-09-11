import { test, expect } from '../fixtures/test-options';
import users from '../test-data/users.json';

test.describe('Login', () => {
  test('standard user reaches the inventory page', async ({ loginPage, page }) => {
    await loginPage.goto();
    await loginPage.login(users.standard.username, users.standard.password);
    await expect(page).toHaveURL(/inventory\.html$/);
  });

  test('locked-out user sees an error', async ({ loginPage }) => {
    await loginPage.goto();
    await loginPage.login(users.lockedOut.username, users.lockedOut.password);
    await loginPage.expectError('locked out');
  });
});

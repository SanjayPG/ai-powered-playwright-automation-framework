import { test, expect } from '@playwright/test'; // (A) bypasses the shared fixtures / Page Objects

test('checkout', async ({ page }) => {
  // (B) hardcoded credentials and absolute URL inline
  await page.goto('https://www.saucedemo.com');
  await page.fill('#user-name', 'standard_user');
  await page.fill('#password', 'secret_sauce');
  await page.click('#login-button');

  await page.click('#add-to-cart-sauce-labs-backpack');
  await page.click('.shopping_cart_link');

  // (C) brittle selector — structural CSS + positional index
  await page.locator('.cart_footer button').nth(1).click();

  await page.fill('#first-name', 'Sam');
  await page.fill('#last-name', 'Tester');
  await page.fill('#postal-code', '560001');
  await page.click('#continue');

  // (D) hard wait
  await page.waitForTimeout(3000);

  await page.click('#finish');
  await expect(page.locator('.complete-header')).toHaveText('Thank you for your order!');
});

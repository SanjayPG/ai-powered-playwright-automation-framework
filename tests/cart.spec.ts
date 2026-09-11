import { test, expect } from '../fixtures/test-options';

test.describe('Cart', () => {
  test('a product added on the inventory page appears in the cart', async ({
    standardUserInventory,
    cartPage,
  }) => {
    await standardUserInventory.addToCart('Sauce Labs Bike Light');
    await standardUserInventory.openCart();
    await expect(cartPage.itemNames()).toContainText(['Sauce Labs Bike Light']);
  });
});

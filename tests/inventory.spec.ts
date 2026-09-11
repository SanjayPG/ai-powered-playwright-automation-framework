import { test, expect } from '../fixtures/test-options';

test.describe('Inventory', () => {
  test('adding one product increments the cart badge', async ({ standardUserInventory }) => {
    await standardUserInventory.addToCart('Sauce Labs Backpack');
    expect(await standardUserInventory.cartCount()).toBe(1);
  });

  test('products can be sorted by name Z to A', async ({ standardUserInventory, page }) => {
    await standardUserInventory.sortBy('Name (Z to A)');
    const names = await page.getByTestId('inventory-item-name').allTextContents();
    expect(names).toEqual([...names].sort().reverse());
  });
});

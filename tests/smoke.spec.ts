import { test } from '../fixtures/test-options';

// (H) performs actions but asserts nothing
test('app smoke', async ({ standardUserInventory }) => {
  await standardUserInventory.addToCart('Sauce Labs Backpack');
  await standardUserInventory.openCart();
});

// (I) skipped with no reason and no linked ticket
test.skip('cart persists after logout and back in', async ({ standardUserInventory }) => {
  // TODO fix later
  await standardUserInventory.addToCart('Sauce Labs Backpack');
});

import { Locator } from '@playwright/test';
import { BasePage } from './base.page';

export class InventoryPage extends BasePage {
  private readonly sortSelect: Locator = this.page.getByTestId('product-sort-container');
  private readonly cartBadge: Locator = this.page.getByTestId('shopping-cart-badge');
  private readonly cartLink: Locator = this.page.getByTestId('shopping-cart-link');

  private itemCard(productName: string): Locator {
    return this.page.getByTestId('inventory-item').filter({ hasText: productName });
  }

  async addToCart(productName: string): Promise<void> {
    await this.itemCard(productName).getByRole('button', { name: 'Add to cart' }).click();
  }

  async removeFromCart(productName: string): Promise<void> {
    await this.itemCard(productName).getByRole('button', { name: 'Remove' }).click();
  }

  async cartCount(): Promise<number> {
    if ((await this.cartBadge.count()) === 0) return 0;
    return Number((await this.cartBadge.textContent())?.trim() ?? '0');
  }

  async sortBy(optionLabel: string): Promise<void> {
    await this.sortSelect.selectOption({ label: optionLabel });
  }

  async openCart(): Promise<void> {
    await this.cartLink.click();
  }
}

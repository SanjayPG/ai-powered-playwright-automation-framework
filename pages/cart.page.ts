import { Locator } from '@playwright/test';
import { BasePage } from './base.page';

export class CartPage extends BasePage {
  private readonly checkoutButton: Locator = this.page.getByTestId('checkout');
  private readonly continueShoppingButton: Locator = this.page.getByTestId('continue-shopping');

  itemNames(): Locator {
    return this.page.getByTestId('inventory-item-name');
  }

  async checkout(): Promise<void> {
    await this.checkoutButton.click();
  }

  async continueShopping(): Promise<void> {
    await this.continueShoppingButton.click();
  }
}

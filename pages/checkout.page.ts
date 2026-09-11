import { Locator, expect } from '@playwright/test';
import { BasePage } from './base.page';

export class CheckoutPage extends BasePage {
  private readonly firstName: Locator = this.page.getByTestId('firstName');
  private readonly lastName: Locator = this.page.getByTestId('lastName');
  private readonly postalCode: Locator = this.page.getByTestId('postalCode');
  private readonly continueButton: Locator = this.page.getByTestId('continue');
  private readonly finishButton: Locator = this.page.getByTestId('finish');
  private readonly completeHeader: Locator = this.page.getByTestId('complete-header');

  async fillDetails(firstName: string, lastName: string, postalCode: string): Promise<void> {
    await this.firstName.fill(firstName);
    await this.lastName.fill(lastName);
    await this.postalCode.fill(postalCode);
    await this.continueButton.click();
  }

  async finish(): Promise<void> {
    await this.finishButton.click();
  }

  async expectOrderComplete(): Promise<void> {
    await expect(this.completeHeader).toHaveText('Thank you for your order!');
  }
}

/**
 * Payment E2E test fixtures for POS
 * @see 045G_POS_E2E_TESTING.md
 */

import type { Page } from '@playwright/test';

/**
 * Test card numbers
 */
export const TEST_CARDS = {
  VALID: {
    number: '4242424242424242',
    last4: '4242',
    expiry: '12/25',
    cvv: '123',
    name: 'Test User',
    zip: '12345',
  },
  DECLINED: {
    number: '4000000000000000',
    last4: '0000',
    expiry: '12/25',
    cvv: '123',
    name: 'Test User',
    zip: '12345',
  },
  EXPIRED: {
    number: '4000000000009999',
    last4: '9999',
    expiry: '01/20',
    cvv: '123',
    name: 'Test User',
    zip: '12345',
  },
} as const;

export type CardType = keyof typeof TEST_CARDS;

/**
 * Process card payment
 */
export async function processCardPayment(
  page: Page,
  cardType: CardType = 'VALID'
): Promise<void> {
  const card = TEST_CARDS[cardType];

  // Select card payment
  await page.getByRole('button', { name: /card|credit|debit/i }).click();

  // Wait for card form
  await page.waitForSelector('[data-testid="card-payment-form"]', { timeout: 3000 });

  // Fill card details (if CNP form is shown)
  const cardNumberInput = page.getByPlaceholder(/card number/i);
  if ((await cardNumberInput.count()) > 0) {
    await cardNumberInput.fill(card.number);
    await page.getByPlaceholder(/expiry|mm.*yy/i).fill(card.expiry);
    await page.getByPlaceholder(/cvv|cvc/i).fill(card.cvv);
    await page.getByPlaceholder(/name on card/i).fill(card.name);
    await page.getByPlaceholder(/zip|postal/i).fill(card.zip);
  }

  // Process payment
  await page.getByRole('button', { name: /process|pay|complete/i }).click();
}

/**
 * Process cash payment
 */
export async function processCashPayment(page: Page, amountTendered: number): Promise<void> {
  // Select cash payment
  await page.getByRole('button', { name: /cash/i }).click();

  // Enter amount tendered
  await page.getByPlaceholder(/amount tendered|cash received/i).fill(String(amountTendered));

  // Complete payment
  await page.getByRole('button', { name: /complete|process/i }).click();
}

/**
 * Process payment with generic "process" command (for mocked terminals)
 */
export async function processPayment(page: Page, type: 'valid-card' | 'declined-card' | 'cash'): Promise<void> {
  if (type === 'cash') {
    // Get total from page and tender exact amount
    const totalText = (await page.getByTestId('cart-total').textContent()) || '0';
    const total = parseFloat(totalText.replace(/[^0-9.]/g, ''));
    await processCashPayment(page, total);
  } else if (type === 'valid-card') {
    await processCardPayment(page, 'VALID');
  } else if (type === 'declined-card') {
    await processCardPayment(page, 'DECLINED');
  }
}

/**
 * Process net terms payment (B2B)
 */
export async function processNetTermsPayment(
  page: Page,
  terms: 'NET_30' | 'NET_60' | 'NET_90',
  poNumber?: string
): Promise<void> {
  // Select net terms
  await page.getByRole('button', { name: /net terms|invoice/i }).click();

  // Select terms
  await page.getByLabel(/payment terms/i).selectOption(terms);

  // Enter PO if provided
  if (poNumber) {
    await page.getByPlaceholder(/po number|purchase order/i).fill(poNumber);
  }

  // Complete
  await page.getByRole('button', { name: /complete|process/i }).click();
}

/**
 * Set up split payment
 */
export async function startSplitPayment(page: Page): Promise<void> {
  await page.getByRole('button', { name: /split|multiple payments/i }).click();
  await page.waitForSelector('[data-testid="split-payment-panel"]', { timeout: 3000 });
}

/**
 * Add payment to split
 */
export async function addSplitPayment(
  page: Page,
  method: 'card' | 'cash',
  amount: number
): Promise<void> {
  // Click add payment
  await page.getByRole('button', { name: /add payment/i }).click();

  // Select method
  await page.getByRole('button', { name: new RegExp(method, 'i') }).click();

  // Enter amount
  await page.getByPlaceholder(/amount/i).fill(String(amount));

  // Confirm
  await page.getByRole('button', { name: /add|confirm/i }).click();
}

/**
 * Complete split payment
 */
export async function completeSplitPayment(page: Page): Promise<void> {
  await page.getByRole('button', { name: /complete|finalize/i }).click();
}

/**
 * Wait for payment result
 */
export async function waitForPaymentResult(
  page: Page
): Promise<'approved' | 'declined' | 'error'> {
  try {
    await page.waitForSelector('[data-testid="payment-approved"]', { timeout: 5000 });
    return 'approved';
  } catch {
    try {
      await page.waitForSelector('[data-testid="payment-declined"]', { timeout: 1000 });
      return 'declined';
    } catch {
      return 'error';
    }
  }
}

/**
 * Get change due amount
 */
export async function getChangeDue(page: Page): Promise<number> {
  const changeElement = page.getByTestId('change-due');
  if (!(await changeElement.isVisible())) {
    return 0;
  }
  const text = (await changeElement.textContent()) || '0';
  return parseFloat(text.replace(/[^0-9.]/g, ''));
}

/**
 * Retry payment after failure
 */
export async function retryPayment(page: Page): Promise<void> {
  await page.getByRole('button', { name: /try again|retry/i }).click();
}

/**
 * Select different payment method after failure
 */
export async function selectDifferentPayment(page: Page): Promise<void> {
  await page.getByRole('button', { name: /different|another|change payment/i }).click();
}

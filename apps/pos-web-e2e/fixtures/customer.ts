/**
 * Customer E2E test fixtures for POS
 * @see 045G_POS_E2E_TESTING.md
 */

import type { Page } from '@playwright/test';

/**
 * Test customers
 */
export const TEST_CUSTOMERS = {
  D2C_GOLD: {
    id: 'CUST-D2C-001',
    email: 'jane@email.com',
    phone: '555-123-4567',
    name: 'Jane Consumer',
    type: 'D2C' as const,
    loyaltyTier: 'GOLD',
  },
  D2C_BRONZE: {
    id: 'CUST-D2C-002',
    email: 'bob.shopper@email.com',
    phone: '555-987-6543',
    name: 'Bob Shopper',
    type: 'D2C' as const,
    loyaltyTier: 'BRONZE',
  },
  B2B_PREMIER: {
    id: 'CUST-B2B-001',
    email: 'purchasing@acmecorp.com',
    phone: '555-ACME-001',
    name: 'ACME Corp',
    type: 'B2B' as const,
    b2bTier: 'PREMIER',
    creditLimit: 50000,
    availableCredit: 45000,
  },
  B2B_ENTERPRISE: {
    id: 'CUST-B2B-002',
    email: 'orders@techco.com',
    phone: '555-TECH-002',
    name: 'TechCo Inc',
    type: 'B2B' as const,
    b2bTier: 'ENTERPRISE',
    creditLimit: 200000,
    availableCredit: 175000,
  },
  B2B_LOW_CREDIT: {
    id: 'CUST-B2B-004',
    email: 'orders@lowcredit.com',
    phone: '555-LOW-0001',
    name: 'Low Credit Inc',
    type: 'B2B' as const,
    b2bTier: 'STANDARD',
    creditLimit: 5000,
    availableCredit: 500,
  },
} as const;

export type CustomerType = keyof typeof TEST_CUSTOMERS;

/**
 * Look up customer by email
 */
export async function lookupCustomerByEmail(page: Page, email: string): Promise<void> {
  const searchInput = page.getByPlaceholder(/customer email|phone|search/i);
  await searchInput.fill(email);
  await page.keyboard.press('Enter');

  // Wait for customer to load or not found message
  await Promise.race([
    page.waitForSelector('[data-testid="customer-profile"]', { timeout: 3000 }),
    page.waitForSelector('[data-testid="customer-not-found"]', { timeout: 3000 }),
  ]);
}

/**
 * Look up customer by phone
 */
export async function lookupCustomerByPhone(page: Page, phone: string): Promise<void> {
  const searchInput = page.getByPlaceholder(/customer email|phone|search/i);
  await searchInput.fill(phone);
  await page.keyboard.press('Enter');

  // Wait for customer to load or not found message
  await Promise.race([
    page.waitForSelector('[data-testid="customer-profile"]', { timeout: 3000 }),
    page.waitForSelector('[data-testid="customer-not-found"]', { timeout: 3000 }),
  ]);
}

/**
 * Attach customer to current transaction
 */
export async function attachCustomer(page: Page, email: string): Promise<void> {
  // Open customer lookup if not already open
  const customerPanel = page.getByTestId('customer-panel');
  if (!(await customerPanel.isVisible())) {
    await page.getByRole('button', { name: /customer|add customer/i }).click();
  }

  await lookupCustomerByEmail(page, email);

  // Click attach/select button
  await page.getByRole('button', { name: /attach|select|use/i }).click();

  // Wait for customer to be attached
  await page.waitForSelector('[data-testid="attached-customer"]', { timeout: 3000 });
}

/**
 * Create new customer
 */
export async function createCustomer(
  page: Page,
  customerData: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    type?: 'D2C' | 'B2B';
    companyName?: string;
  }
): Promise<void> {
  // Click create new customer
  await page.getByRole('button', { name: /create|new customer/i }).click();

  // Fill form
  await page.getByLabel(/first name/i).fill(customerData.firstName);
  await page.getByLabel(/last name/i).fill(customerData.lastName);
  await page.getByLabel(/email/i).fill(customerData.email);
  await page.getByLabel(/phone/i).fill(customerData.phone);

  if (customerData.type) {
    await page.getByLabel(/type/i).selectOption(customerData.type);
  }

  if (customerData.companyName) {
    await page.getByLabel(/company/i).fill(customerData.companyName);
  }

  // Submit
  await page.getByRole('button', { name: /save|create/i }).click();

  // Wait for success
  await page.waitForSelector('[data-testid="customer-created"]', { timeout: 3000 });
}

/**
 * Skip customer lookup (guest checkout)
 */
export async function skipCustomer(page: Page): Promise<void> {
  const skipButton = page.getByRole('button', { name: /skip|guest|continue without/i });
  if ((await skipButton.count()) > 0) {
    await skipButton.click();
  }
}

/**
 * Get customer info from UI
 */
export async function getAttachedCustomer(page: Page): Promise<{
  name: string;
  type: string;
  tier?: string;
  points?: number;
  credit?: number;
} | null> {
  const customerElement = page.getByTestId('attached-customer');
  if (!(await customerElement.isVisible())) {
    return null;
  }

  const name = (await customerElement.getByTestId('customer-name').textContent()) || '';
  const type = (await customerElement.getByTestId('customer-type').textContent()) || '';

  const result: {
    name: string;
    type: string;
    tier?: string;
    points?: number;
    credit?: number;
  } = { name, type };

  // Get loyalty info if D2C
  const tierElement = customerElement.getByTestId('loyalty-tier');
  if ((await tierElement.count()) > 0) {
    result.tier = (await tierElement.textContent()) || undefined;
    const pointsText =
      (await customerElement.getByTestId('loyalty-points').textContent()) || '0';
    result.points = parseInt(pointsText.replace(/\D/g, ''));
  }

  // Get credit info if B2B
  const creditElement = customerElement.getByTestId('available-credit');
  if ((await creditElement.count()) > 0) {
    const creditText = (await creditElement.textContent()) || '0';
    result.credit = parseFloat(creditText.replace(/[^0-9.]/g, ''));
  }

  return result;
}

/**
 * Select customer address
 */
export async function selectAddress(page: Page, addressIndex: number): Promise<void> {
  await page.getByTestId(`address-option-${addressIndex}`).click();
}

/**
 * Add new address during checkout
 */
export async function addAddress(
  page: Page,
  address: {
    name: string;
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
  }
): Promise<void> {
  await page.getByRole('button', { name: /add.*address|new address/i }).click();

  await page.getByLabel(/name/i).fill(address.name);
  await page.getByLabel(/address line 1|street/i).fill(address.line1);
  if (address.line2) {
    await page.getByLabel(/address line 2|apt/i).fill(address.line2);
  }
  await page.getByLabel(/city/i).fill(address.city);
  await page.getByLabel(/state/i).fill(address.state);
  await page.getByLabel(/zip|postal/i).fill(address.postalCode);

  await page.getByRole('button', { name: /save|add/i }).click();
}

import { test, expect, Page } from '@playwright/test';

/**
 * E2E Tests for Offline POS - Full Transaction Flow
 *
 * These tests interact with the UI like a real user:
 * - Type in search boxes
 * - Click buttons
 * - Navigate via links
 * NO direct API calls to add items or complete transactions.
 *
 * Prerequisites:
 * - App running on localhost:3000
 * - Database seeded with tools/seed-data.sql
 */

// Test data - matches seed-data.sql
const TEST_OPERATOR = {
  pin: '1234',
  name: 'John Smith',
};

const TEST_PRODUCTS = {
  bananas: {
    upc: '012345678901',
    name: 'Organic Bananas (bunch)',
    price: 199,
    department: 'Grocery',
  },
  milk: {
    upc: '012345678902',
    name: 'Whole Milk 1 Gallon',
    price: 449,
    department: 'Grocery',
  },
  chips: {
    upc: '023456789012',
    name: 'Potato Chips Family Size',
    price: 449,
    department: 'Snacks',
  },
  chicken: {
    upc: '056789012345',
    name: 'Rotisserie Chicken',
    price: 799,
    department: 'Deli',
  },
};

// Helper to login
async function login(page: Page) {
  await page.goto('/');
  await page.fill('input[name="pin"]', TEST_OPERATOR.pin);
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/\/scan/);
}

// Helper to search and add product to cart via UI
async function searchAndAddProduct(page: Page, searchTerm: string, expectedName: string) {
  const searchInput = page.locator('#search-input');

  // Clear any previous search first
  await searchInput.clear();
  await searchInput.fill(searchTerm);

  // Wait for search results to appear (300ms debounce + API call time)
  const productCard = page.locator('.product-card', { hasText: expectedName });
  await expect(productCard).toBeVisible({ timeout: 10000 });

  // Click Add to Cart button on the product card
  const addButton = productCard.locator('.add-btn');
  await addButton.click();

  // Wait for feedback to appear (indicating item was added)
  const feedback = page.locator('#scan-feedback');
  await expect(feedback).toBeVisible({ timeout: 2000 });
  await expect(feedback).toContainText('Added:', { timeout: 2000 });

  // Wait for action buttons to update (Edit Cart replaces Cart Empty)
  await expect(page.locator('a[href="/cart"]')).toContainText('Edit Cart', { timeout: 5000 });

  // Wait for feedback to hide and search to clear (done by JS)
  await expect(searchInput).toHaveValue('', { timeout: 3000 });
}

test.describe('Offline POS - Login Flow', () => {
  test('should display login page', async ({ page }) => {
    await page.goto('/');

    await expect(page.locator('h1')).toContainText('Operator Login');
    await expect(page.locator('input[name="pin"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should login with valid PIN', async ({ page }) => {
    await page.goto('/');

    await page.fill('input[name="pin"]', TEST_OPERATOR.pin);
    await page.click('button[type="submit"]');

    // Should redirect to scan page
    await expect(page).toHaveURL(/\/scan/);
    await expect(page.locator('text=Scan barcode')).toBeVisible();
  });

  test('should reject invalid PIN', async ({ page }) => {
    await page.goto('/');

    await page.fill('input[name="pin"]', '9876'); // Invalid PIN
    await page.click('button[type="submit"]');

    // Should show error or stay on login
    await expect(page).toHaveURL(/\//);
  });

  test('should logout and return to login', async ({ page }) => {
    await login(page);

    // Logout
    await page.click('button:has-text("Logout"), form[action="/logout"] button');

    // Should be back at login
    await expect(page).toHaveURL(/\//);
  });
});

test.describe('Offline POS - Product Search UI', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should display search results when typing product name', async ({ page }) => {
    const searchInput = page.locator('#search-input');
    await searchInput.fill('milk');

    // Wait for results to appear in the UI
    const resultsDiv = page.locator('#search-results');
    await expect(resultsDiv.locator('.product-card')).toBeVisible({ timeout: 5000 });

    // Verify milk product is shown
    await expect(resultsDiv).toContainText('Whole Milk');
    await expect(resultsDiv).toContainText('$4.49');
  });

  test('should display search results when typing UPC', async ({ page }) => {
    const searchInput = page.locator('#search-input');
    await searchInput.fill(TEST_PRODUCTS.bananas.upc);

    // Wait for results to appear
    const resultsDiv = page.locator('#search-results');
    await expect(resultsDiv.locator('.product-card')).toBeVisible({ timeout: 5000 });

    // Verify bananas product is shown
    await expect(resultsDiv).toContainText('Organic Bananas');
  });

  test('should display "No products found" for non-existent search', async ({ page }) => {
    const searchInput = page.locator('#search-input');
    await searchInput.fill('xyznonexistent');

    // Wait for no results message
    const resultsDiv = page.locator('#search-results');
    await expect(resultsDiv).toContainText('No products found', { timeout: 5000 });
  });

  test('should clear results when search is cleared', async ({ page }) => {
    const searchInput = page.locator('#search-input');

    // Search first
    await searchInput.fill('milk');
    await expect(page.locator('#search-results .product-card')).toBeVisible({ timeout: 5000 });

    // Clear search
    await searchInput.clear();

    // Results should be gone
    await expect(page.locator('#search-results')).toBeEmpty();
  });
});

test.describe('Offline POS - Add to Cart via UI', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should add item to cart by searching and clicking Add button', async ({ page }) => {
    // Search for milk
    await searchAndAddProduct(page, 'milk', 'Whole Milk');

    // Navigate to cart
    await page.click('a[href="/cart"]');
    await expect(page).toHaveURL(/\/cart/);

    // Verify milk is in cart
    await expect(page.locator('.cart-item')).toContainText('Whole Milk');
    await expect(page.locator('.cart-item .qty')).toContainText('1');
  });

  test('should add multiple different items to cart', async ({ page }) => {
    // Add bananas
    await searchAndAddProduct(page, 'banana', 'Organic Bananas');

    // Add milk
    await searchAndAddProduct(page, 'milk', 'Whole Milk');

    // Add chips
    await searchAndAddProduct(page, 'chip', 'Potato Chips');

    // Navigate to cart
    await page.click('a[href="/cart"]');
    await expect(page).toHaveURL(/\/cart/);

    // Verify all items in cart
    await expect(page.locator('.cart-item')).toHaveCount(3);
    await expect(page.locator('.cart-items')).toContainText('Organic Bananas');
    await expect(page.locator('.cart-items')).toContainText('Whole Milk');
    await expect(page.locator('.cart-items')).toContainText('Potato Chips');
  });

  test('should increment quantity when adding same item twice', async ({ page }) => {
    // Add bananas twice
    await searchAndAddProduct(page, 'banana', 'Organic Bananas');
    await searchAndAddProduct(page, 'banana', 'Organic Bananas');

    // Navigate to cart
    await page.click('a[href="/cart"]');
    await expect(page).toHaveURL(/\/cart/);

    // Verify quantity is 2
    await expect(page.locator('.cart-item')).toHaveCount(1);
    await expect(page.locator('.cart-item .qty')).toContainText('2');
  });

  test('should update action buttons after adding item', async ({ page }) => {
    // Initially cart should be empty
    await expect(page.locator('a[href="/cart"]')).toContainText('Cart Empty');

    // Add an item - helper already verifies action buttons updated
    await searchAndAddProduct(page, 'milk', 'Whole Milk');

    // Verify Pay button shows price
    await expect(page.locator('a[href="/payment"]')).toContainText('Pay $');

    // Add another item
    await searchAndAddProduct(page, 'banana', 'Organic Bananas');

    // Cart preview should show item count when > 1 item
    await expect(page.locator('.cart-preview-header')).toContainText('2 items');
  });
});

test.describe('Offline POS - Cart Page UI', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should show empty cart message when cart is empty', async ({ page }) => {
    await page.goto('/cart');

    await expect(page.locator('text=Cart is empty')).toBeVisible();
    await expect(page.locator('a[href="/scan"]')).toContainText('Start Scanning');
  });

  test('should display cart items with quantities and prices', async ({ page }) => {
    // Add items via search UI
    await searchAndAddProduct(page, 'banana', 'Organic Bananas');
    await searchAndAddProduct(page, 'milk', 'Whole Milk');

    // Navigate to cart
    await page.click('a[href="/cart"]');

    // Verify items displayed
    await expect(page.locator('.cart-item')).toHaveCount(2);
    await expect(page.locator('.cart-items')).toContainText('$1.99');
    await expect(page.locator('.cart-items')).toContainText('$4.49');

    // Verify totals shown
    await expect(page.locator('.cart-totals')).toContainText('Subtotal');
    await expect(page.locator('.cart-totals')).toContainText('Tax');
    await expect(page.locator('.cart-totals')).toContainText('Total');
  });

  test('should increment quantity using + button', async ({ page }) => {
    // Add item
    await searchAndAddProduct(page, 'banana', 'Organic Bananas');
    await page.click('a[href="/cart"]');

    // Initial quantity should be 1
    await expect(page.locator('.cart-item .qty')).toContainText('1');

    // Click + button
    await page.click('.cart-item button:has-text("+")');

    // Wait for page reload and verify quantity
    await expect(page.locator('.cart-item .qty')).toContainText('2');
  });

  test('should decrement quantity using - button', async ({ page }) => {
    // Add item twice via UI
    await searchAndAddProduct(page, 'banana', 'Organic Bananas');
    await searchAndAddProduct(page, 'banana', 'Organic Bananas');
    await page.click('a[href="/cart"]');

    // Initial quantity should be 2
    await expect(page.locator('.cart-item .qty')).toContainText('2');

    // Click - button
    await page.click('.cart-item button:has-text("-")');

    // Wait for page reload and verify quantity
    await expect(page.locator('.cart-item .qty')).toContainText('1');
  });

  test('should remove item using x button', async ({ page }) => {
    // Add two different items
    await searchAndAddProduct(page, 'banana', 'Organic Bananas');
    await searchAndAddProduct(page, 'milk', 'Whole Milk');
    await page.click('a[href="/cart"]');

    await expect(page.locator('.cart-item')).toHaveCount(2);

    // Remove bananas
    const bananasItem = page.locator('.cart-item', { hasText: 'Organic Bananas' });
    await bananasItem.locator('button:has-text("×")').click();

    // Verify only milk remains
    await expect(page.locator('.cart-item')).toHaveCount(1);
    await expect(page.locator('.cart-items')).toContainText('Whole Milk');
    await expect(page.locator('.cart-items')).not.toContainText('Organic Bananas');
  });

  test('should navigate to payment from cart', async ({ page }) => {
    // Add item
    await searchAndAddProduct(page, 'banana', 'Organic Bananas');
    await page.click('a[href="/cart"]');

    // Click Pay button
    await page.click('a[href="/payment"]');

    await expect(page).toHaveURL(/\/payment/);
  });

  test('should navigate back to scan from cart', async ({ page }) => {
    // Add item
    await searchAndAddProduct(page, 'banana', 'Organic Bananas');
    await page.click('a[href="/cart"]');

    // Click Add More Items
    await page.click('a[href="/scan"]');

    await expect(page).toHaveURL(/\/scan/);
  });
});

test.describe('Offline POS - Payment Flow UI', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should display payment page with total', async ({ page }) => {
    // Add items
    await searchAndAddProduct(page, 'banana', 'Organic Bananas');
    await page.click('a[href="/cart"]');
    await page.click('a[href="/payment"]');

    // Verify payment page
    await expect(page.locator('h1')).toContainText('Payment');
    await expect(page.locator('.payment-amount')).toContainText('Total');
    await expect(page.locator('#btn-card')).toBeVisible();
    await expect(page.locator('#btn-cash')).toBeVisible();
  });

  test('should complete cash transaction via UI', async ({ page }) => {
    // Add items
    await searchAndAddProduct(page, 'banana', 'Organic Bananas');
    await page.click('a[href="/cart"]');
    await page.click('a[href="/payment"]');

    // Click Pay with Cash
    await page.click('#btn-cash');

    // Should redirect to complete page
    await expect(page).toHaveURL(/\/complete/, { timeout: 5000 });
    await expect(page.locator('h1')).toContainText('Transaction Complete');
    await expect(page.locator('.transaction-id')).toBeVisible();
  });

  test('should go back to cart from payment', async ({ page }) => {
    // Add items
    await searchAndAddProduct(page, 'banana', 'Organic Bananas');
    await page.click('a[href="/cart"]');
    await page.click('a[href="/payment"]');

    // Click Back to Cart
    await page.click('a[href="/cart"]');

    await expect(page).toHaveURL(/\/cart/);
  });
});

test.describe('Offline POS - Complete Page UI', () => {
  test('should display transaction complete with ID and total', async ({ page }) => {
    await login(page);

    // Add items and complete transaction
    await searchAndAddProduct(page, 'banana', 'Organic Bananas');
    await page.click('a[href="/cart"]');
    await page.click('a[href="/payment"]');
    await page.click('#btn-cash');

    // Verify complete page
    await expect(page).toHaveURL(/\/complete/);
    await expect(page.locator('h1')).toContainText('Transaction Complete');
    await expect(page.locator('.transaction-id')).not.toBeEmpty();
    await expect(page.locator('text=Total:')).toBeVisible();
  });

  test('should start new transaction from complete page', async ({ page }) => {
    await login(page);

    // Complete a transaction
    await searchAndAddProduct(page, 'banana', 'Organic Bananas');
    await page.click('a[href="/cart"]');
    await page.click('a[href="/payment"]');
    await page.click('#btn-cash');

    await expect(page).toHaveURL(/\/complete/);

    // Start new transaction
    await page.click('a[href="/scan"]');

    await expect(page).toHaveURL(/\/scan/);

    // Cart should be empty
    await expect(page.locator('a[href="/cart"]')).toContainText('Cart Empty');
  });

  test('should sign out from complete page', async ({ page }) => {
    await login(page);

    // Complete a transaction
    await searchAndAddProduct(page, 'banana', 'Organic Bananas');
    await page.click('a[href="/cart"]');
    await page.click('a[href="/payment"]');
    await page.click('#btn-cash');

    await expect(page).toHaveURL(/\/complete/);

    // Sign out
    await page.click('button:has-text("Sign Out")');

    await expect(page).toHaveURL(/\//);
    await expect(page.locator('h1')).toContainText('Login');
  });
});

test.describe('Offline POS - Full Transaction E2E', () => {
  test('complete transaction: login -> search -> add items -> cart -> payment -> complete', async ({ page }) => {
    // STEP 1: Login
    await page.goto('/');
    await expect(page.locator('h1')).toContainText('Login');
    await page.fill('input[name="pin"]', TEST_OPERATOR.pin);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/scan/);

    // STEP 2: Search and add products via UI
    // Note: searchAndAddProduct helper now waits for cart count to update
    // Add bananas (qty 1)
    await searchAndAddProduct(page, 'banana', 'Organic Bananas');

    // Add bananas again (qty 2)
    await searchAndAddProduct(page, 'banana', 'Organic Bananas');

    // Add milk (qty 3)
    await searchAndAddProduct(page, 'milk', 'Whole Milk');

    // Add chicken (qty 4)
    await searchAndAddProduct(page, 'chicken', 'Rotisserie Chicken');

    // STEP 3: Navigate to cart and verify
    await page.click('a[href="/cart"]');
    await expect(page).toHaveURL(/\/cart/);

    // Verify all items in cart
    await expect(page.locator('.cart-items')).toContainText('Organic Bananas');
    await expect(page.locator('.cart-items')).toContainText('Whole Milk');
    await expect(page.locator('.cart-items')).toContainText('Rotisserie Chicken');

    // Verify bananas quantity is 2
    const bananasItem = page.locator('.cart-item', { hasText: 'Organic Bananas' });
    await expect(bananasItem.locator('.qty')).toContainText('2');

    // STEP 4: Go to payment
    await page.click('a[href="/payment"]');
    await expect(page).toHaveURL(/\/payment/);
    await expect(page.locator('.payment-amount')).toContainText('Total');

    // STEP 5: Complete transaction with cash
    await page.click('#btn-cash');

    // STEP 6: Verify transaction complete
    await expect(page).toHaveURL(/\/complete/, { timeout: 5000 });
    await expect(page.locator('h1')).toContainText('Transaction Complete');

    // Transaction ID should be displayed
    const txnId = await page.locator('.transaction-id').textContent();
    expect(txnId).toBeTruthy();
    expect(txnId!.length).toBeGreaterThan(0);

    // STEP 7: Start new transaction and verify cart is cleared
    await page.click('a[href="/scan"]');
    await expect(page).toHaveURL(/\/scan/);
    await expect(page.locator('a[href="/cart"]')).toContainText('Cart Empty');
  });

  test('complete multiple transactions in sequence', async ({ page }) => {
    await login(page);

    // Transaction 1: Single item
    await searchAndAddProduct(page, 'banana', 'Organic Bananas');
    await page.click('a[href="/cart"]');
    await page.click('a[href="/payment"]');
    await page.click('#btn-cash');
    await expect(page).toHaveURL(/\/complete/);
    await page.click('a[href="/scan"]');
    await expect(page.locator('#search-input')).toBeVisible();

    // Transaction 2: Multiple items
    await searchAndAddProduct(page, 'milk', 'Whole Milk');
    await searchAndAddProduct(page, 'chip', 'Potato Chips');
    await searchAndAddProduct(page, 'chicken', 'Rotisserie Chicken');
    await page.click('a[href="/cart"]');
    await expect(page.locator('.cart-item')).toHaveCount(3);
    await page.click('a[href="/payment"]');
    await page.click('#btn-cash');
    await expect(page).toHaveURL(/\/complete/);
    await page.click('a[href="/scan"]');
    await expect(page.locator('#search-input')).toBeVisible();

    // Transaction 3: Same item multiple times
    for (let i = 0; i < 3; i++) {
      await searchAndAddProduct(page, 'banana', 'Organic Bananas');
    }
    await page.click('a[href="/cart"]');
    await expect(page.locator('.cart-item .qty')).toContainText('3');
    await page.click('a[href="/payment"]');
    await page.click('#btn-cash');
    await expect(page).toHaveURL(/\/complete/);
  });

  test('transaction with quantity updates and removals via cart UI', async ({ page }) => {
    await login(page);

    // Add items
    await searchAndAddProduct(page, 'banana', 'Organic Bananas');
    await searchAndAddProduct(page, 'milk', 'Whole Milk');
    await searchAndAddProduct(page, 'chip', 'Potato Chips');
    await searchAndAddProduct(page, 'chicken', 'Rotisserie Chicken');

    await page.click('a[href="/cart"]');
    await expect(page.locator('.cart-item')).toHaveCount(4);

    // Increase bananas quantity using + button
    const bananasItem = page.locator('.cart-item', { hasText: 'Organic Bananas' });
    await bananasItem.locator('button:has-text("+")').click();
    await expect(bananasItem.locator('.qty')).toContainText('2');

    // Remove chips
    const chipsItem = page.locator('.cart-item', { hasText: 'Potato Chips' });
    await chipsItem.locator('button:has-text("×")').click();
    await expect(page.locator('.cart-item')).toHaveCount(3);

    // Complete transaction
    await page.click('a[href="/payment"]');
    await page.click('#btn-cash');
    await expect(page).toHaveURL(/\/complete/);
  });
});

test.describe('Offline POS - Search by UPC Flow', () => {
  test('should add product by searching for UPC', async ({ page }) => {
    await login(page);

    // Search by UPC
    const searchInput = page.locator('#search-input');
    await searchInput.fill(TEST_PRODUCTS.milk.upc);

    // Wait for results
    const resultsDiv = page.locator('#search-results');
    await expect(resultsDiv.locator('.product-card')).toBeVisible({ timeout: 5000 });

    // Should show the milk product
    await expect(resultsDiv).toContainText('Whole Milk');

    // Add to cart
    await resultsDiv.locator('.add-btn').click();
    await expect(page.locator('#scan-feedback')).toBeVisible();

    // Verify in cart
    await page.click('a[href="/cart"]');
    await expect(page.locator('.cart-items')).toContainText('Whole Milk');
  });
});

test.describe('Offline POS - Proceed to Checkout Link', () => {
  test('should navigate directly to payment from scan page', async ({ page }) => {
    await login(page);

    // Add item first
    await searchAndAddProduct(page, 'banana', 'Organic Bananas');

    // Use Proceed to Checkout link
    await page.click('a[href="/payment"]');

    await expect(page).toHaveURL(/\/payment/);
    await expect(page.locator('.payment-amount')).toContainText('Total');
  });
});

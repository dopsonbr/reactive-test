import { test, expect } from '../fixtures/test-base';

test.describe('Cart Flow (Full-Stack)', () => {
  test.beforeEach(async ({ page }) => {
    // Set up session for test isolation
    // Cart-service requires cartId to be a valid UUID
    // Only generate new IDs if they don't exist (preserve across navigations within same test)
    await page.addInitScript(() => {
      const cartId = sessionStorage.getItem('cartId') || crypto.randomUUID();
      const orderId = sessionStorage.getItem('orderNumber') || crypto.randomUUID();
      const sessionId = sessionStorage.getItem('sessionId') || crypto.randomUUID();
      sessionStorage.setItem('cartId', cartId);
      sessionStorage.setItem('userId', 'E2EUSR');
      sessionStorage.setItem('storeNumber', '1');
      sessionStorage.setItem('orderNumber', orderId);
      sessionStorage.setItem('sessionId', sessionId);
    });
  });

  test('add to cart calls real backend via GraphQL', async ({ page }) => {
    await page.goto('/');

    // Wait for products to load
    await page.waitForResponse('**/products/search**');
    await page.locator('[data-testid^="product-card-"]').first().waitFor();

    // Add to cart
    const addButton = page
      .locator('[data-testid^="product-card-"]')
      .first()
      .getByRole('button', { name: /add to cart/i });

    // Set up response listener BEFORE clicking to avoid race condition
    const cartResponsePromise = page.waitForResponse((res) =>
      res.url().includes('/graphql') && res.request().method() === 'POST'
    );

    await addButton.click();

    // Wait for GraphQL mutation (POST to /graphql or /api/cart/graphql)
    const cartResponse = await cartResponsePromise;

    // GraphQL returns 200 even for successful mutations
    expect(cartResponse.status()).toBe(200);

    // Verify response is valid GraphQL
    const body = await cartResponse.json();
    expect(body.data).toBeDefined();
    expect(body.errors).toBeUndefined();

    // Cart count should update
    await expect(page.getByTestId('cart-count')).toBeVisible();
  });

  test('cart page loads from real backend via GraphQL', async ({ page }) => {
    // First add an item - set up response listener before navigation
    const productResponsePromise = page.waitForResponse('**/products/search**');
    await page.goto('/');
    await productResponsePromise;
    await page.locator('[data-testid^="product-card-"]').first().waitFor();

    // Set up GraphQL response listener before clicking
    const cartAddResponsePromise = page.waitForResponse((res) =>
      res.url().includes('/graphql') && res.request().method() === 'POST'
    );
    await page
      .locator('[data-testid^="product-card-"]')
      .first()
      .getByRole('button', { name: /add to cart/i })
      .click();
    await cartAddResponsePromise;
    console.log('Item added to cart for cart page load test');

    // Navigate to cart
    await page.getByTestId('cart-link').click();
    await expect(page).toHaveURL('/cart');

    // Verify cart loaded - check for cart page elements
    // React Query may use cached data, so just wait for UI to show cart content
    await expect(
      page.getByRole('heading', { name: /your cart/i, level: 1 })
    ).toBeVisible({ timeout: 10000 });

    // Verify cart has items
    await expect(page.locator('[data-testid^="cart-item-"]').first()).toBeVisible({ timeout: 10000 });
  });

  test('update quantity persists to backend via GraphQL', async ({ page }) => {
    // Add item first
    await page.goto('/');
    await page.waitForResponse('**/products/search**');
    await page.locator('[data-testid^="product-card-"]').first().waitFor();

    // Set up response listener before action
    const addResponsePromise = page.waitForResponse((res) =>
      res.url().includes('/graphql') && res.request().method() === 'POST'
    );

    await page
      .locator('[data-testid^="product-card-"]')
      .first()
      .getByRole('button', { name: /add to cart/i })
      .click();

    await addResponsePromise;

    // Go to cart
    await page.getByTestId('cart-link').click();

    // Wait for cart items to be visible (React Query may use cached data, so don't wait for GraphQL)
    await expect(page.locator('[data-testid^="cart-item-"]').first()).toBeVisible({ timeout: 10000 });

    // Find and click increase button - wait for it to be enabled (not just visible)
    const increaseButton = page.getByRole('button', { name: 'Increase quantity' });
    await expect(increaseButton).toBeEnabled({ timeout: 10000 });

    // Set up update mutation listener before clicking
    // Filter by content-type to avoid catching SSE subscription responses
    const updateResponsePromise = page.waitForResponse((res) =>
      res.url().includes('/graphql') &&
      res.request().method() === 'POST' &&
      res.headers()['content-type']?.includes('application/json')
    );

    await increaseButton.click();

    // Wait for GraphQL update mutation
    const updateResponse = await updateResponsePromise;

    expect(updateResponse.status()).toBe(200);

    const body = await updateResponse.json();
    expect(body.data).toBeDefined();
    expect(body.errors).toBeUndefined();
  });

  test('remove item calls backend via GraphQL', async ({ page }) => {
    // Add item first
    await page.goto('/');
    await page.waitForResponse('**/products/search**');
    await page.locator('[data-testid^="product-card-"]').first().waitFor();

    // Set up response listener before action
    const addResponsePromise = page.waitForResponse((res) =>
      res.url().includes('/graphql') && res.request().method() === 'POST'
    );

    await page
      .locator('[data-testid^="product-card-"]')
      .first()
      .getByRole('button', { name: /add to cart/i })
      .click();

    await addResponsePromise;

    // Go to cart
    await page.getByTestId('cart-link').click();

    // Wait for cart items to be visible (React Query may use cached data, so don't wait for GraphQL)
    await expect(page.locator('[data-testid^="cart-item-"]').first()).toBeVisible({ timeout: 10000 });

    // Find and click remove button - wait for it to be enabled (not just visible)
    const removeButton = page.getByRole('button', { name: 'Remove' });
    await expect(removeButton).toBeEnabled({ timeout: 10000 });

    // Set up delete mutation listener before clicking
    // Filter by content-type to avoid catching SSE subscription responses
    const deleteResponsePromise = page.waitForResponse((res) =>
      res.url().includes('/graphql') &&
      res.request().method() === 'POST' &&
      res.headers()['content-type']?.includes('application/json')
    );

    await removeButton.click();

    // Wait for GraphQL remove mutation
    const deleteResponse = await deleteResponsePromise;

    expect(deleteResponse.status()).toBe(200);

    const body = await deleteResponse.json();
    expect(body.data).toBeDefined();
    expect(body.errors).toBeUndefined();
  });
});

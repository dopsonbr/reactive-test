import { test, expect } from '../fixtures/test-base';

test.describe('Cart Flow (Full-Stack)', () => {
  test.beforeEach(async ({ page }) => {
    // Set up session for test isolation
    // Cart-service requires cartId to be a valid UUID
    await page.addInitScript(() => {
      const cartId = crypto.randomUUID();
      const orderId = crypto.randomUUID();
      const sessionId = crypto.randomUUID();
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

    // Set up response listener before navigation to avoid race condition
    const cartQueryResponsePromise = page.waitForResponse((res) =>
      res.url().includes('/graphql') && res.request().method() === 'POST'
    );

    // Navigate to cart
    await page.getByTestId('cart-link').click();
    await expect(page).toHaveURL('/cart');

    // Wait for GraphQL cart query
    await cartQueryResponsePromise;

    // Verify cart loaded - check for cart page elements
    await expect(
      page.getByText(/your cart/i).or(page.getByText(/shopping cart/i)).or(page.getByText(/empty/i))
    ).toBeVisible({ timeout: 10000 });
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

    // Set up cart query listener before navigation
    const cartQueryPromise = page.waitForResponse((res) =>
      res.url().includes('/graphql') && res.request().method() === 'POST'
    );

    // Go to cart
    await page.getByTestId('cart-link').click();
    await cartQueryPromise;

    // Wait for cart items to be visible
    await expect(page.locator('[data-testid^="cart-item-"]').first()).toBeVisible({ timeout: 10000 });

    // Find and click increase button
    const increaseButton = page.getByRole('button', { name: 'Increase quantity' });
    if (await increaseButton.isVisible({ timeout: 5000 })) {
      // Set up update mutation listener before clicking
      const updateResponsePromise = page.waitForResponse((res) =>
        res.url().includes('/graphql') && res.request().method() === 'POST'
      );

      await increaseButton.click();

      // Wait for GraphQL update mutation
      const updateResponse = await updateResponsePromise;

      expect(updateResponse.status()).toBe(200);

      const body = await updateResponse.json();
      expect(body.data).toBeDefined();
      expect(body.errors).toBeUndefined();
    }
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

    // Set up cart query listener before navigation
    const cartQueryPromise = page.waitForResponse((res) =>
      res.url().includes('/graphql') && res.request().method() === 'POST'
    );

    // Go to cart
    await page.getByTestId('cart-link').click();
    await cartQueryPromise;

    // Wait for cart items to be visible
    await expect(page.locator('[data-testid^="cart-item-"]').first()).toBeVisible({ timeout: 10000 });

    // Remove item
    const removeButton = page.getByRole('button', { name: 'Remove' });
    if (await removeButton.isVisible({ timeout: 5000 })) {
      // Set up delete mutation listener before clicking
      const deleteResponsePromise = page.waitForResponse((res) =>
        res.url().includes('/graphql') && res.request().method() === 'POST'
      );

      await removeButton.click();

      // Wait for GraphQL remove mutation
      const deleteResponse = await deleteResponsePromise;

      expect(deleteResponse.status()).toBe(200);

      const body = await deleteResponse.json();
      expect(body.data).toBeDefined();
      expect(body.errors).toBeUndefined();
    }
  });
});

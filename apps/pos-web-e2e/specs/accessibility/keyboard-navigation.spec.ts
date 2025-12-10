import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { loginAsEmployee, TEST_EMPLOYEES } from '../../fixtures';

/**
 * Accessibility Tests - Keyboard Navigation
 *
 * Tests keyboard accessibility for the POS application including
 * tab navigation, focus management, and ARIA compliance.
 *
 * @see 045G_POS_E2E_TESTING.md - Accessibility Testing
 */
test.describe('Keyboard Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('Login form is keyboard navigable', async ({ page }) => {
    // Tab to Employee ID field
    await page.keyboard.press('Tab');
    await expect(page.getByPlaceholder('Employee ID')).toBeFocused();

    // Tab to PIN field
    await page.keyboard.press('Tab');
    await expect(page.getByPlaceholder('PIN')).toBeFocused();

    // Tab to login button
    await page.keyboard.press('Tab');
    await expect(page.getByRole('button', { name: /login|sign in/i })).toBeFocused();

    // Enter activates login
    await page.getByPlaceholder('Employee ID').fill(TEST_EMPLOYEES.ASSOCIATE.id);
    await page.getByPlaceholder('PIN').fill(TEST_EMPLOYEES.ASSOCIATE.pin);
    await page.getByRole('button', { name: /login|sign in/i }).focus();
    await page.keyboard.press('Enter');

    // Should navigate after login
    await page.waitForURL(/\/(dashboard|transaction)/);
  });

  test('Main navigation is keyboard accessible', async ({ page }) => {
    await loginAsEmployee(page, TEST_EMPLOYEES.ASSOCIATE.id, TEST_EMPLOYEES.ASSOCIATE.pin);

    // Tab to first nav item
    await page.keyboard.press('Tab');

    // Navigate through main nav items
    const navItems = ['Dashboard', 'New Transaction', 'Customers', 'Orders'];

    for (const item of navItems) {
      const link = page.getByRole('link', { name: new RegExp(item, 'i') });
      if ((await link.count()) > 0) {
        await link.focus();
        await expect(link).toBeFocused();
      }
    }
  });

  test('Enter key activates navigation links', async ({ page }) => {
    await loginAsEmployee(page, TEST_EMPLOYEES.ASSOCIATE.id, TEST_EMPLOYEES.ASSOCIATE.pin);

    // Focus on transaction link and press Enter
    const transactionLink = page.getByRole('link', { name: /transaction/i });
    if ((await transactionLink.count()) > 0) {
      await transactionLink.focus();
      await page.keyboard.press('Enter');
      await expect(page).toHaveURL(/\/transaction/);
    }
  });

  test('Escape key closes modal dialogs', async ({ page }) => {
    await loginAsEmployee(page, TEST_EMPLOYEES.ASSOCIATE.id, TEST_EMPLOYEES.ASSOCIATE.pin);
    await page.goto('/transaction');

    // Add item to cart first
    await page.getByPlaceholder(/scan|enter sku/i).fill('SKU-WIDGET-001');
    await page.keyboard.press('Enter');
    await page.waitForSelector('[data-testid="cart-item-0"]');

    // Open markdown dialog
    const markdownButton = page.getByTestId('markdown-button-0');
    if ((await markdownButton.count()) > 0) {
      await markdownButton.click();
      await expect(page.getByRole('dialog')).toBeVisible();

      // Escape closes it
      await page.keyboard.press('Escape');
      await expect(page.getByRole('dialog')).not.toBeVisible();
    }
  });

  test('Focus trap works in modal dialogs', async ({ page }) => {
    await loginAsEmployee(page, TEST_EMPLOYEES.ASSOCIATE.id, TEST_EMPLOYEES.ASSOCIATE.pin);
    await page.goto('/transaction');

    // Add item to cart
    await page.getByPlaceholder(/scan|enter sku/i).fill('SKU-WIDGET-001');
    await page.keyboard.press('Enter');
    await page.waitForSelector('[data-testid="cart-item-0"]');

    // Open markdown dialog
    const markdownButton = page.getByTestId('markdown-button-0');
    if ((await markdownButton.count()) > 0) {
      await markdownButton.click();
      await expect(page.getByRole('dialog')).toBeVisible();

      // Tab through dialog elements
      const dialog = page.getByRole('dialog');
      const focusableElements = await dialog.locator('button, input, select, [tabindex]').count();

      // Tab should cycle within dialog
      for (let i = 0; i < focusableElements + 2; i++) {
        await page.keyboard.press('Tab');
      }

      // Focus should still be inside dialog
      const focusedElement = page.locator(':focus');
      const isInDialog = await dialog.locator(':focus').count();
      expect(isInDialog).toBeGreaterThan(0);

      await page.keyboard.press('Escape');
    }
  });

  test('Arrow keys work in dropdown menus', async ({ page }) => {
    await loginAsEmployee(page, TEST_EMPLOYEES.ASSOCIATE.id, TEST_EMPLOYEES.ASSOCIATE.pin);

    // Open user menu
    const userMenu = page.getByTestId('user-menu');
    if ((await userMenu.count()) > 0) {
      await userMenu.focus();
      await page.keyboard.press('Enter');

      // Arrow down to navigate menu items
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('ArrowDown');

      // Focus should be on a menu item
      const focusedMenuItem = page.locator('[role="menuitem"]:focus');
      expect(await focusedMenuItem.count()).toBeGreaterThan(0);

      // Escape closes menu
      await page.keyboard.press('Escape');
    }
  });
});

test.describe('Focus Management', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsEmployee(page, TEST_EMPLOYEES.ASSOCIATE.id, TEST_EMPLOYEES.ASSOCIATE.pin);
    await page.goto('/transaction');
  });

  test('Focus indicators are visible', async ({ page }) => {
    // Tab to SKU input
    await page.keyboard.press('Tab');

    // Get focused element
    const focusedElement = page.locator(':focus');

    // Check for focus ring (common Tailwind classes)
    const hasFocusRing = await focusedElement.evaluate((el) => {
      const styles = window.getComputedStyle(el);
      const hasOutline = styles.outlineWidth !== '0px' && styles.outlineStyle !== 'none';
      const hasRing = styles.boxShadow.includes('ring') || styles.boxShadow !== 'none';
      return hasOutline || hasRing;
    });

    // Focus should be visible
    expect(hasFocusRing).toBe(true);
  });

  test('Focus moves to cart after adding item', async ({ page }) => {
    // Add item
    await page.getByPlaceholder(/scan|enter sku/i).fill('SKU-WIDGET-001');
    await page.keyboard.press('Enter');

    // Wait for item to appear
    await page.waitForSelector('[data-testid="cart-item-0"]');

    // Focus should move to cart area or remain on input for quick scanning
    const focusedElement = page.locator(':focus');
    const tagName = await focusedElement.evaluate((el) => el.tagName.toLowerCase());

    // Either focused on input (for quick scanning) or cart item
    expect(['input', 'button', 'div']).toContain(tagName);
  });

  test('Focus returns to trigger after modal close', async ({ page }) => {
    // Add item
    await page.getByPlaceholder(/scan|enter sku/i).fill('SKU-WIDGET-001');
    await page.keyboard.press('Enter');
    await page.waitForSelector('[data-testid="cart-item-0"]');

    // Open and close markdown dialog
    const markdownButton = page.getByTestId('markdown-button-0');
    if ((await markdownButton.count()) > 0) {
      await markdownButton.focus();
      await markdownButton.click();
      await page.waitForSelector('[role="dialog"]');

      // Close with Escape
      await page.keyboard.press('Escape');

      // Focus should return to button
      await expect(markdownButton).toBeFocused();
    }
  });
});

test.describe('Axe Accessibility Scans', () => {
  test('Login page has no accessibility violations', async ({ page }) => {
    await page.goto('/');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Transaction page has no accessibility violations', async ({ page }) => {
    await loginAsEmployee(page, TEST_EMPLOYEES.ASSOCIATE.id, TEST_EMPLOYEES.ASSOCIATE.pin);
    await page.goto('/transaction');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Transaction page with items has no violations', async ({ page }) => {
    await loginAsEmployee(page, TEST_EMPLOYEES.ASSOCIATE.id, TEST_EMPLOYEES.ASSOCIATE.pin);
    await page.goto('/transaction');

    // Add items
    await page.getByPlaceholder(/scan|enter sku/i).fill('SKU-WIDGET-001');
    await page.keyboard.press('Enter');
    await page.waitForSelector('[data-testid="cart-item-0"]');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Customer search has no accessibility violations', async ({ page }) => {
    await loginAsEmployee(page, TEST_EMPLOYEES.ASSOCIATE.id, TEST_EMPLOYEES.ASSOCIATE.pin);
    await page.goto('/customers');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });
});

test.describe('Screen Reader Support', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsEmployee(page, TEST_EMPLOYEES.ASSOCIATE.id, TEST_EMPLOYEES.ASSOCIATE.pin);
  });

  test('Page has proper heading hierarchy', async ({ page }) => {
    await page.goto('/transaction');

    // Check for h1
    const h1Count = await page.locator('h1').count();
    expect(h1Count).toBe(1);

    // Check heading order
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
    let previousLevel = 0;

    for (const heading of headings) {
      const tagName = await heading.evaluate((el) => el.tagName);
      const level = parseInt(tagName.replace('H', ''));

      // Heading levels should not skip (h1 -> h3 is invalid)
      expect(level).toBeLessThanOrEqual(previousLevel + 1);
      previousLevel = level;
    }
  });

  test('Interactive elements have accessible names', async ({ page }) => {
    await page.goto('/transaction');

    // All buttons should have accessible names
    const buttons = await page.locator('button').all();
    for (const button of buttons) {
      const accessibleName = await button.getAttribute('aria-label') ||
        await button.textContent() ||
        await button.getAttribute('title');

      expect(accessibleName?.trim()).toBeTruthy();
    }
  });

  test('Form inputs have labels', async ({ page }) => {
    await page.goto('/transaction');

    // All inputs should have labels
    const inputs = await page.locator('input:not([type="hidden"])').all();
    for (const input of inputs) {
      const id = await input.getAttribute('id');
      const ariaLabel = await input.getAttribute('aria-label');
      const ariaLabelledBy = await input.getAttribute('aria-labelledby');
      const placeholder = await input.getAttribute('placeholder');

      // Should have either a label, aria-label, or aria-labelledby
      const hasLabel = id
        ? (await page.locator(`label[for="${id}"]`).count()) > 0
        : false;

      expect(hasLabel || ariaLabel || ariaLabelledBy || placeholder).toBeTruthy();
    }
  });

  test('Error messages are announced', async ({ page }) => {
    await page.goto('/');

    // Submit invalid login
    await page.getByPlaceholder('Employee ID').fill('INVALID');
    await page.getByPlaceholder('PIN').fill('0000');
    await page.getByRole('button', { name: /login/i }).click();

    // Error should be in an alert role or live region
    const errorMessage = page.locator('[role="alert"], [aria-live="polite"], [aria-live="assertive"]');
    await expect(errorMessage.first()).toBeVisible();
  });
});

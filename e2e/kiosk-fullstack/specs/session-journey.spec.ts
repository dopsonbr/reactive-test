import { test, expect, startSession } from '../fixtures';

/**
 * Full-Stack Kiosk Session Management
 *
 * Tests session lifecycle: start, timeout warnings, and cleanup.
 */

test.describe('Kiosk Session Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      sessionStorage.clear();
      localStorage.clear();
    });
  });

  test('starts new session on touch', async ({ page }) => {
    await page.goto('/');

    // Welcome screen visible
    await expect(page.getByRole('button', { name: /touch to start/i })).toBeVisible();

    // Start session
    await page.getByRole('button', { name: /touch to start/i }).click();

    // Should be on scanning page
    await expect(page.getByText(/scan your items/i)).toBeVisible();
  });

  test('can cancel session and return to welcome', async ({ page }) => {
    await startSession(page);

    // Set up handler for native confirm() dialog BEFORE clicking cancel
    page.on('dialog', async (dialog) => {
      expect(dialog.type()).toBe('confirm');
      expect(dialog.message()).toContain('Cancel your transaction');
      await dialog.accept();
    });

    // Click cancel button in header
    const cancelBtn = page.getByRole('button', { name: /cancel/i });
    await expect(cancelBtn).toBeVisible();
    await cancelBtn.click();

    // Should return to welcome screen
    await expect(page.getByRole('button', { name: /touch to start/i })).toBeVisible({ timeout: 5000 });
  });
});

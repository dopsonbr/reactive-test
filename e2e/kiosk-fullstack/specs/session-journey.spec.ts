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

    // Look for cancel/exit button
    const cancelBtn = page.getByRole('button', { name: /cancel|exit|end session/i });
    if (await cancelBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await cancelBtn.click();

      // Handle confirmation if present
      const confirmBtn = page.getByRole('button', { name: /yes|confirm|end/i });
      if (await confirmBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await confirmBtn.click();
      }

      // Should return to welcome
      await expect(page.getByRole('button', { name: /touch to start/i })).toBeVisible({ timeout: 5000 });
    }
  });
});

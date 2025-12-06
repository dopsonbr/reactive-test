import { test, expect } from '@playwright/test';

/**
 * Visual regression tests for the UI component library.
 * Uses Playwright to capture and compare screenshots of component stories.
 */

// Helper to wait for story content to be ready
async function waitForStory(page: import('@playwright/test').Page) {
  // Wait for the Ladle preview iframe content to load
  await page.waitForLoadState('networkidle');
  // Give a small buffer for any animations to complete
  await page.waitForTimeout(500);
}

test.describe('Visual Regression Tests', () => {
  test.describe('Foundations', () => {
    test('colors - semantic colors', async ({ page }) => {
      await page.goto('/?story=foundations-colors--semantic-colors');
      await waitForStory(page);
      await expect(page).toHaveScreenshot('colors-semantic.png', { fullPage: true });
    });

    test('colors - primitive palette', async ({ page }) => {
      await page.goto('/?story=foundations-colors--primitive-palette');
      await waitForStory(page);
      await expect(page).toHaveScreenshot('colors-primitive.png', { fullPage: true });
    });

    test('typography - all scales', async ({ page }) => {
      await page.goto('/?story=foundations-typography--all-scales');
      await waitForStory(page);
      await expect(page).toHaveScreenshot('typography-scales.png', { fullPage: true });
    });

    test('spacing', async ({ page }) => {
      await page.goto('/?story=foundations-spacing--spacing-scale');
      await waitForStory(page);
      await expect(page).toHaveScreenshot('spacing.png', { fullPage: true });
    });
  });

  test.describe('Components', () => {
    test('button - all variants', async ({ page }) => {
      await page.goto('/?story=components-button--all-variants');
      await waitForStory(page);
      await expect(page).toHaveScreenshot('button-variants.png', { fullPage: true });
    });

    test('button - all sizes', async ({ page }) => {
      await page.goto('/?story=components-button--sizes');
      await waitForStory(page);
      await expect(page).toHaveScreenshot('button-sizes.png', { fullPage: true });
    });

    test('input - default', async ({ page }) => {
      await page.goto('/?story=components-input--default');
      await waitForStory(page);
      await expect(page).toHaveScreenshot('input-default.png', { fullPage: true });
    });

    test('input - with label', async ({ page }) => {
      await page.goto('/?story=components-input--with-label');
      await waitForStory(page);
      await expect(page).toHaveScreenshot('input-with-label.png', { fullPage: true });
    });

    test('input - disabled', async ({ page }) => {
      await page.goto('/?story=components-input--disabled');
      await waitForStory(page);
      await expect(page).toHaveScreenshot('input-disabled.png', { fullPage: true });
    });

    test('card - default', async ({ page }) => {
      await page.goto('/?story=components-card--default');
      await waitForStory(page);
      await expect(page).toHaveScreenshot('card-default.png', { fullPage: true });
    });

    test('card - with all sections', async ({ page }) => {
      await page.goto('/?story=components-card--with-all-sections');
      await waitForStory(page);
      await expect(page).toHaveScreenshot('card-all-sections.png', { fullPage: true });
    });

    test('textarea - default', async ({ page }) => {
      await page.goto('/?story=components-textarea--default');
      await waitForStory(page);
      await expect(page).toHaveScreenshot('textarea-default.png', { fullPage: true });
    });

    test('checkbox - default', async ({ page }) => {
      await page.goto('/?story=components-checkbox--default');
      await waitForStory(page);
      await expect(page).toHaveScreenshot('checkbox-default.png', { fullPage: true });
    });

    test('checkbox - all states', async ({ page }) => {
      await page.goto('/?story=components-checkbox--all-states');
      await waitForStory(page);
      await expect(page).toHaveScreenshot('checkbox-states.png', { fullPage: true });
    });

    test('breadcrumb - default', async ({ page }) => {
      await page.goto('/?story=components-breadcrumb--default');
      await waitForStory(page);
      await expect(page).toHaveScreenshot('breadcrumb-default.png', { fullPage: true });
    });
  });

  test.describe('Patterns', () => {
    test('login form', async ({ page }) => {
      await page.goto('/?story=patterns-login-form--default');
      await waitForStory(page);
      await expect(page).toHaveScreenshot('pattern-login-form.png', { fullPage: true });
    });
  });

  test.describe('Dark Mode', () => {
    test('button - dark mode', async ({ page }) => {
      await page.goto('/?story=components-button--all-variants&mode=dark');
      await waitForStory(page);
      await expect(page).toHaveScreenshot('button-variants-dark.png', { fullPage: true });
    });

    test('card - dark mode', async ({ page }) => {
      await page.goto('/?story=components-card--with-all-sections&mode=dark');
      await waitForStory(page);
      await expect(page).toHaveScreenshot('card-all-sections-dark.png', { fullPage: true });
    });

    test('input - dark mode', async ({ page }) => {
      await page.goto('/?story=components-input--with-label&mode=dark');
      await waitForStory(page);
      await expect(page).toHaveScreenshot('input-with-label-dark.png', { fullPage: true });
    });
  });
});

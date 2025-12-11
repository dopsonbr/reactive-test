# 052: Offline POS UX Improvement

**Status:** Ready for Implementation
**Design:** [2024-12-11-offline-pos-ux-design.md](../2024-12-11-offline-pos-ux-design.md)

## Overview

Align offline-pos visual appearance with the shared design system (`libs/frontend/shared-design/tokens/`) while maintaining the vanilla HTML/CSS/JS architecture. Uses Pico CSS as base with design token overlays.

## Prerequisites

- [ ] Offline-pos app runs locally: `pnpm nx serve offline-pos`

## Implementation Tasks

### Task 1: Create tokens.css

**File:** `apps/offline-pos/static/css/tokens.css`

Copy design tokens from `libs/frontend/shared-design/tokens/src/` (colors, typography, spacing) into a single file. Light mode only - omit `.dark` selectors.

**Content:**
```css
/* Design System Tokens for Offline POS
 * Source: libs/frontend/shared-design/tokens/src/
 * Light mode only - sync manually when source tokens change
 */

:root {
  /* === Colors (from colors.css) === */
  /* Primitive palette */
  --color-gray-50: oklch(0.985 0 0);
  --color-gray-100: oklch(0.967 0 0);
  --color-gray-200: oklch(0.928 0 0);
  --color-gray-300: oklch(0.872 0 0);
  --color-gray-400: oklch(0.707 0 0);
  --color-gray-500: oklch(0.551 0 0);
  --color-gray-600: oklch(0.446 0 0);
  --color-gray-700: oklch(0.373 0 0);
  --color-gray-800: oklch(0.269 0 0);
  --color-gray-900: oklch(0.205 0 0);
  --color-gray-950: oklch(0.145 0 0);

  /* Orange palette */
  --color-orange-50: hsl(33, 100%, 96%);
  --color-orange-100: hsl(34, 100%, 92%);
  --color-orange-200: hsl(32, 98%, 83%);
  --color-orange-300: hsl(31, 97%, 72%);
  --color-orange-400: hsl(27, 96%, 61%);
  --color-orange-500: hsl(25, 95%, 53%);
  --color-orange-600: hsl(21, 90%, 48%);
  --color-orange-700: hsl(17, 88%, 40%);
  --color-orange-800: hsl(15, 79%, 34%);
  --color-orange-900: hsl(15, 75%, 28%);
  --color-orange-950: hsl(13, 81%, 15%);

  /* Semantic tokens (light mode) */
  --color-background: hsl(0, 0%, 100%);
  --color-foreground: hsl(20, 14.3%, 4.1%);
  --color-muted: hsl(60, 4.8%, 95.9%);
  --color-muted-foreground: hsl(25, 5.3%, 44.7%);
  --color-border: hsl(20, 5.9%, 90%);
  --color-input: hsl(20, 5.9%, 90%);
  --color-ring: hsl(24.6, 95%, 53.1%);

  --color-primary: hsl(24.6, 95%, 53.1%);
  --color-primary-foreground: hsl(60, 9.1%, 97.8%);
  --color-secondary: hsl(60, 4.8%, 95.9%);
  --color-secondary-foreground: hsl(24, 9.8%, 10%);

  --color-destructive: hsl(0, 84.2%, 60.2%);
  --color-destructive-foreground: hsl(60, 9.1%, 97.8%);

  --color-accent: hsl(60, 4.8%, 95.9%);
  --color-accent-foreground: hsl(24, 9.8%, 10%);

  --color-card: hsl(0, 0%, 100%);
  --color-card-foreground: hsl(20, 14.3%, 4.1%);

  --color-popover: hsl(0, 0%, 100%);
  --color-popover-foreground: hsl(20, 14.3%, 4.1%);

  /* Success color (not in shared-design, added for POS) */
  --color-success: hsl(142, 76%, 36%);
  --color-success-foreground: hsl(0, 0%, 100%);

  /* === Typography (from typography.css) === */
  --font-sans: ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji";
  --font-mono: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace;

  --text-xs: 0.75rem;
  --text-sm: 0.875rem;
  --text-base: 1rem;
  --text-lg: 1.125rem;
  --text-xl: 1.25rem;
  --text-2xl: 1.5rem;
  --text-3xl: 1.875rem;
  --text-4xl: 2.25rem;

  --leading-none: 1;
  --leading-tight: 1.25;
  --leading-snug: 1.375;
  --leading-normal: 1.5;
  --leading-relaxed: 1.625;
  --leading-loose: 2;

  --font-normal: 400;
  --font-medium: 500;
  --font-semibold: 600;
  --font-bold: 700;

  --tracking-tighter: -0.05em;
  --tracking-tight: -0.025em;
  --tracking-normal: 0em;
  --tracking-wide: 0.025em;

  /* === Spacing (from spacing.css) === */
  --spacing-0: 0px;
  --spacing-px: 1px;
  --spacing-0-5: 0.125rem;
  --spacing-1: 0.25rem;
  --spacing-1-5: 0.375rem;
  --spacing-2: 0.5rem;
  --spacing-2-5: 0.625rem;
  --spacing-3: 0.75rem;
  --spacing-3-5: 0.875rem;
  --spacing-4: 1rem;
  --spacing-5: 1.25rem;
  --spacing-6: 1.5rem;
  --spacing-7: 1.75rem;
  --spacing-8: 2rem;
  --spacing-9: 2.25rem;
  --spacing-10: 2.5rem;
  --spacing-12: 3rem;
  --spacing-14: 3.5rem;
  --spacing-16: 4rem;
  --spacing-20: 5rem;
  --spacing-24: 6rem;

  --radius-sm: 0.125rem;
  --radius-md: 0.375rem;
  --radius-lg: 0.5rem;
  --radius-xl: 0.75rem;
  --radius-2xl: 1rem;
  --radius-full: 9999px;
  --radius: 0.5rem;
}
```

**Verification:**
```bash
# File exists and has correct structure
head -20 apps/offline-pos/static/css/tokens.css
```

---

### Task 2: Create pico-overrides.css

**File:** `apps/offline-pos/static/css/pico-overrides.css`

Map design tokens to Pico CSS variables to change Pico's default appearance.

**Content:**
```css
/* Pico CSS Overrides
 * Maps design system tokens to Pico CSS variables
 * Load after pico.min.css and tokens.css
 */

:root {
  /* === Color Mappings === */
  --pico-primary: var(--color-primary);
  --pico-primary-hover: var(--color-orange-600);
  --pico-primary-focus: var(--color-ring);
  --pico-primary-inverse: var(--color-primary-foreground);

  --pico-background-color: var(--color-background);
  --pico-color: var(--color-foreground);
  --pico-muted-color: var(--color-muted-foreground);
  --pico-muted-border-color: var(--color-border);

  --pico-card-background-color: var(--color-card);
  --pico-card-border-color: var(--color-border);
  --pico-card-sectioning-background-color: var(--color-muted);

  /* Form elements */
  --pico-form-element-background-color: var(--color-background);
  --pico-form-element-border-color: var(--color-input);
  --pico-form-element-focus-color: var(--color-ring);

  /* Secondary/outline buttons */
  --pico-secondary: var(--color-secondary-foreground);
  --pico-secondary-hover: var(--color-gray-700);
  --pico-secondary-background: var(--color-secondary);
  --pico-secondary-border: var(--color-border);

  /* === Typography === */
  --pico-font-family: var(--font-sans);
  --pico-font-family-monospace: var(--font-mono);
  --pico-font-size: var(--text-base);
  --pico-font-weight: var(--font-normal);
  --pico-line-height: var(--leading-normal);

  /* === Spacing & Radius === */
  --pico-border-radius: var(--radius-md);
  --pico-spacing: var(--spacing-4);
  --pico-block-spacing-vertical: var(--spacing-4);
  --pico-block-spacing-horizontal: var(--spacing-4);

  /* === Transitions === */
  --pico-transition: 0.15s ease-in-out;
}

/* Button improvements to match shared-ui */
button,
[type="submit"],
[type="button"],
[role="button"] {
  font-weight: var(--font-medium);
  border-radius: var(--radius-md);
  transition: background-color 0.15s ease, border-color 0.15s ease;
}

/* Focus ring style matching shared-ui */
:focus-visible {
  outline: 2px solid var(--color-ring);
  outline-offset: 2px;
}

/* Card/article styling */
article {
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border);
}

/* Input focus states */
input:focus,
select:focus,
textarea:focus {
  border-color: var(--color-ring);
  box-shadow: 0 0 0 3px hsla(24.6, 95%, 53.1%, 0.1);
}
```

**Verification:**
```bash
# File exists
ls -la apps/offline-pos/static/css/pico-overrides.css
```

---

### Task 3: Update styles.css

**File:** `apps/offline-pos/static/css/styles.css`

Update existing custom styles to use design tokens instead of hardcoded values.

**Changes:**

Replace the entire file with:

```css
/* Offline POS Custom Styles
 * Uses design system tokens from tokens.css
 */

/* === Header === */
header nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--spacing-4);
}

.store-id,
.operator {
  font-size: var(--text-sm);
  color: var(--color-muted-foreground);
}

/* === Status Banner === */
.banner {
  padding: var(--spacing-2) var(--spacing-4);
  text-align: center;
  font-weight: var(--font-medium);
  font-size: var(--text-sm);
  border-radius: var(--radius-md);
  margin-bottom: var(--spacing-4);
}

.banner.offline {
  background: var(--color-destructive);
  color: var(--color-destructive-foreground);
}

.banner.online {
  background: var(--color-success);
  color: var(--color-success-foreground);
}

.banner.hidden {
  display: none;
}

/* === Login === */
.pin-input {
  font-size: var(--text-3xl);
  text-align: center;
  letter-spacing: var(--spacing-2);
  max-width: 200px;
  font-family: var(--font-mono);
}

/* === Scan Screen === */
.scan-area {
  min-height: 200px;
  border: 2px dashed var(--color-border);
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: var(--spacing-4);
  background: var(--color-muted);
  color: var(--color-muted-foreground);
}

.scan-feedback {
  padding: var(--spacing-4);
  background: var(--color-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  margin-bottom: var(--spacing-4);
  text-align: center;
  font-weight: var(--font-medium);
}

.scan-feedback.success {
  background: var(--color-success);
  color: var(--color-success-foreground);
  border-color: var(--color-success);
}

.scan-feedback.error {
  background: var(--color-destructive);
  color: var(--color-destructive-foreground);
  border-color: var(--color-destructive);
}

/* === Search Results / Product Cards === */
.search-results {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
  margin-bottom: var(--spacing-4);
}

.product-card {
  background: var(--color-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--spacing-4);
}

.product-card header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: var(--spacing-2);
}

.product-card .price {
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  color: var(--color-primary);
}

.product-card footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: var(--spacing-2);
  border-top: 1px solid var(--color-border);
}

.product-card footer small {
  color: var(--color-muted-foreground);
  font-size: var(--text-xs);
}

/* === Cart === */
.cart-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-3) 0;
  border-bottom: 1px solid var(--color-border);
}

.cart-item .name {
  flex: 1;
  font-weight: var(--font-medium);
}

.cart-item .qty-controls {
  display: flex;
  gap: var(--spacing-2);
  align-items: center;
}

.cart-item .qty-controls button {
  width: var(--spacing-8);
  height: var(--spacing-8);
  padding: 0;
  font-size: var(--text-lg);
}

.cart-totals {
  margin-top: var(--spacing-4);
  padding-top: var(--spacing-4);
  border-top: 2px solid var(--color-border);
  text-align: right;
}

.cart-totals .total {
  font-size: var(--text-2xl);
  font-weight: var(--font-bold);
  color: var(--color-primary);
}

/* === Actions Bar === */
.actions {
  display: flex;
  gap: var(--spacing-4);
  margin-top: var(--spacing-6);
}

.actions a,
.actions button {
  flex: 1;
  text-align: center;
}

/* === Payment === */
.payment-buttons {
  display: flex;
  gap: var(--spacing-4);
  margin-top: var(--spacing-8);
}

.payment-buttons button {
  flex: 1;
  padding: var(--spacing-8) var(--spacing-4);
  font-size: var(--text-xl);
}

.payment-status {
  text-align: center;
  padding: var(--spacing-8);
  font-size: var(--text-xl);
  background: var(--color-muted);
  border-radius: var(--radius-lg);
}

/* === Complete === */
.transaction-complete {
  text-align: center;
  padding: var(--spacing-8);
}

.transaction-complete h1 {
  color: var(--color-success);
  margin-bottom: var(--spacing-4);
}

.transaction-id {
  font-family: var(--font-mono);
  font-size: var(--text-xl);
  background: var(--color-muted);
  padding: var(--spacing-2) var(--spacing-4);
  border-radius: var(--radius-md);
  display: inline-block;
}

/* === Utility Classes === */
.hidden {
  display: none !important;
}

.error {
  color: var(--color-destructive);
}
```

**Verification:**
```bash
# Check file updated
head -30 apps/offline-pos/static/css/styles.css
```

---

### Task 4: Update layout.html

**File:** `apps/offline-pos/templates/layout.html`

Add new CSS file imports in correct order.

**Change:** Update the `<head>` section CSS links from:

```html
<link rel="stylesheet" href="/static/css/pico.min.css">
<link rel="stylesheet" href="/static/css/styles.css">
```

To:

```html
<link rel="stylesheet" href="/static/css/pico.min.css">
<link rel="stylesheet" href="/static/css/tokens.css">
<link rel="stylesheet" href="/static/css/pico-overrides.css">
<link rel="stylesheet" href="/static/css/styles.css">
```

**Verification:**
```bash
# Check CSS imports in layout
grep 'link rel="stylesheet"' apps/offline-pos/templates/layout.html
```

---

### Task 5: Update README.md

**File:** `apps/offline-pos/README.md`

Add documentation about design token synchronization.

**Add section after "## Development":**

```markdown
### Design System Tokens

The offline-pos app uses design tokens copied from `libs/frontend/shared-design/tokens/` for visual consistency with the main e-commerce application.

**Token files:**
- `static/css/tokens.css` - CSS custom properties (colors, typography, spacing)
- `static/css/pico-overrides.css` - Maps tokens to Pico CSS variables

**Syncing tokens:**
When design tokens change in `libs/frontend/shared-design/tokens/src/`, manually update `static/css/tokens.css`:

1. Copy updated values from source files:
   - `colors.css` - Color palette and semantic colors
   - `typography.css` - Font families, sizes, weights
   - `spacing.css` - Spacing scale and border radii

2. Only copy light mode values (omit `.dark` selectors)

3. Test visual appearance: `pnpm nx serve offline-pos`
```

**Verification:**
```bash
# Check section exists
grep -A 5 "Design System Tokens" apps/offline-pos/README.md
```

---

### Task 6: Visual Verification

**Manual testing:** Start the app and visually inspect each page.

```bash
pnpm nx serve offline-pos
# Open http://localhost:3000
```

**Checklist:**
- [ ] Login page - Orange primary button, system font
- [ ] Scan page - Orange "View Cart" button, styled product cards
- [ ] Cart page - Price in orange, clean card styling
- [ ] Payment page - Large orange payment buttons
- [ ] Complete page - Success message styling
- [ ] Status banner - Red for offline, green for online

---

### Task 7: Run E2E Tests

Ensure no functional regressions from style changes.

```bash
pnpm nx e2e offline-pos
```

**Expected:** All tests pass (styling changes should not affect functionality).

---

## Completion Checklist

- [ ] Task 1: tokens.css created
- [ ] Task 2: pico-overrides.css created
- [ ] Task 3: styles.css updated
- [ ] Task 4: layout.html updated
- [ ] Task 5: README.md updated
- [ ] Task 6: Visual verification complete
- [ ] Task 7: E2E tests pass

## Notes

- No changes to HTML structure or JavaScript
- No changes to Go code
- Future token updates require manual sync from shared-design

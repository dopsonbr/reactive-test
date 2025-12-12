# Offline POS UX Improvement Design

**Date:** 2024-12-11
**Status:** Approved

## Overview

Improve the visual consistency of the offline-pos application to align with the shared design system (`libs/frontend/shared-design/` and `libs/frontend/shared-ui/`) while maintaining its vanilla HTML/CSS/JS architecture.

## Decisions Made

| Decision | Choice | Rationale |
|----------|--------|-----------|
| CSS Strategy | Keep Pico CSS + overlay tokens | Faster implementation; Pico handles forms, accessibility, resets |
| Dark Mode | Light mode only | Retail POS terminals need bright displays; simpler implementation |
| Token Source | Copy tokens into offline-pos | Preserves self-contained binary; no npm build step needed |

## CSS Architecture

### File Structure

```
apps/offline-pos/static/css/
├── pico.min.css           # Keep - base framework
├── tokens.css             # NEW - design system tokens (copied from shared-design)
├── pico-overrides.css     # NEW - maps tokens to Pico CSS variables
└── styles.css             # UPDATE - use tokens for custom components
```

### Load Order (layout.html)

1. `pico.min.css` - base framework (reset, forms, accessibility)
2. `tokens.css` - design system CSS custom properties
3. `pico-overrides.css` - bridge tokens → Pico variables
4. `styles.css` - component customizations

## Token-to-Pico Variable Mapping

`pico-overrides.css` maps design tokens to Pico's CSS variables:

```css
:root {
  /* Colors */
  --pico-primary: var(--color-primary);              /* Orange brand */
  --pico-primary-hover: var(--color-primary);
  --pico-background-color: var(--color-background);
  --pico-color: var(--color-foreground);
  --pico-muted-color: var(--color-muted-foreground);
  --pico-muted-border-color: var(--color-border);
  --pico-card-background-color: var(--color-card);

  /* Typography */
  --pico-font-family: var(--font-sans);
  --pico-font-size: var(--text-base);

  /* Spacing/Radius */
  --pico-border-radius: var(--radius-md);
  --pico-spacing: var(--spacing-4);
}
```

## Component Style Updates

### Status Banners
```css
.banner.offline {
  background: var(--color-destructive);
  color: var(--color-destructive-foreground);
}
.banner.online {
  background: var(--color-primary);
  color: var(--color-primary-foreground);
}
```

### Cards/Product Display
```css
.product-card, .scan-feedback, .cart-item {
  background: var(--color-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--spacing-4);
}
```

### Buttons
```css
button, [role="button"] {
  font-family: var(--font-sans);
  font-weight: var(--font-medium);
  border-radius: var(--radius-md);
}
```

### Typography
```css
body {
  font-family: var(--font-sans);
  font-size: var(--text-base);
  line-height: var(--leading-normal);
}
```

## Files Changed

| File | Change Type | Description |
|------|-------------|-------------|
| `static/css/tokens.css` | NEW | Copied design tokens (light mode only) |
| `static/css/pico-overrides.css` | NEW | Pico variable mappings |
| `static/css/styles.css` | UPDATE | Use token variables |
| `templates/layout.html` | UPDATE | Add CSS imports |
| `README.md` | UPDATE | Document token sync process |

## Verification

- Visual review of all 6 pages (login, scan, cart, payment, complete)
- E2E tests continue to pass (no functional changes)
- Side-by-side comparison with ecommerce-web for consistency

## Maintenance

- `tokens.css` header documents source: `libs/frontend/shared-design/tokens/`
- README documents manual sync process when design tokens change

# AGENTS.md - shared-design-tokens

## Boundaries

**This package provides:** CSS custom property design tokens.

**DO NOT:**
- Add JavaScript/TypeScript code (CSS-only package)
- Import runtime dependencies
- Add component-specific styles (those belong in ui-components)

## Conventions

- All tokens defined as CSS custom properties (`--token-name`)
- Tokens wrapped in `@layer tokens` for cascade control
- Semantic tokens reference primitive tokens
- Light/dark variants via `.dark` class selector

## File Structure

| File | Purpose |
|------|---------|
| `colors.css` | Color primitives + semantic mappings |
| `spacing.css` | Spacing scale + border radius |
| `typography.css` | Font families, sizes, weights |
| `shadows.css` | Box shadow elevation tokens |
| `motion.css` | Duration + easing tokens |
| `index.css` | Aggregated export |

## Adding New Tokens

1. Create new `category.css` file
2. Wrap in `@layer tokens { :root { ... } }`
3. Add `@import "./category.css"` to `index.css`
4. Update Tailwind config in ui-components if needed

## Color Space

This design system uses **oklch** color space for primitive colors:
- Perceptual uniformity
- Better color manipulation
- Consistent lightness across hues

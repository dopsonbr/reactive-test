# Design Tokens Standard

## Intent

Define the approved Tailwind design tokens. Only these tokens should be used in code.

## Approved Token Categories

### Colors (Use semantic names)

- `primary`, `primary-foreground`
- `secondary`, `secondary-foreground`
- `muted`, `muted-foreground`
- `accent`, `accent-foreground`
- `destructive`, `destructive-foreground`
- `border`, `input`, `ring`
- `background`, `foreground`

### Spacing (Tailwind defaults)

- `0`, `0.5`, `1`, `1.5`, `2`, `3`, `4`, `5`, `6`, `8`, `10`, `12`, `16`, `20`, `24`
- Avoid arbitrary: `p-[17px]` :x: -> `p-4` :white_check_mark:

### Typography

- Font sizes: `text-xs`, `text-sm`, `text-base`, `text-lg`, `text-xl`, `text-2xl`
- Font weights: `font-normal`, `font-medium`, `font-semibold`, `font-bold`

### Border Radius

- `rounded-none`, `rounded-sm`, `rounded`, `rounded-md`, `rounded-lg`, `rounded-xl`, `rounded-full`

## Anti-patterns

```tsx
// Arbitrary values - NOT ALLOWED
<div className="p-[17px] bg-[#ff0000] text-[13px]">

// Design tokens - CORRECT
<div className="p-4 bg-destructive text-sm">
```

## Enforcement

- ESLint: `reactive/no-hardcoded-colors`
- Stylelint: `reactive/no-arbitrary-values`

## Related

- See `tailwind.config.js` for token definitions
- See `.stylelintrc.json` for Stylelint configuration

# AGENTS.md - ui-components

## Boundaries

**This package provides:** React UI components with Tailwind CSS styling.

**DO NOT:**
- Add design tokens here (they belong in shared-design-tokens)
- Add application-specific components
- Add non-UI utilities (data fetching, state management)

## Conventions

### Component Structure

```
src/components/ui/
  button.tsx      # Component implementation
  button.test.tsx # Component tests

stories/
  components/
    button.stories.tsx  # Ladle stories
```

### CVA Patterns

All components use Class Variance Authority (CVA) for variants:

```tsx
const componentVariants = cva("base-classes", {
  variants: {
    variant: { default: "...", secondary: "..." },
    size: { sm: "...", md: "...", lg: "..." },
  },
  defaultVariants: { variant: "default", size: "md" },
});
```

### Testing Requirements

Every component must have:
1. Render test
2. Variant/size class tests
3. Accessibility test with axe-core
4. Ref forwarding test

## Commands

| Command | Description |
|---------|-------------|
| `pnpm nx test ui-components` | Run all tests |
| `pnpm nx ladle ui-components` | Start Ladle dev server |
| `pnpm nx build ui-components` | Build the library |
| `pnpm nx g @reactive-platform/workspace-plugin:ui-component Name` | Generate component |

## File Structure

| Path | Purpose |
|------|---------|
| `src/components/ui/` | shadcn/ui components |
| `src/lib/utils.ts` | cn() utility function |
| `src/styles/globals.css` | Global styles with tokens |
| `stories/` | Ladle stories by category |
| `.ladle/` | Ladle configuration |
| `components.json` | shadcn/ui configuration |

## Adding Components

Use the custom generator:
```bash
pnpm nx g @reactive-platform/workspace-plugin:ui-component ComponentName --category=components
```

Or add shadcn/ui components:
```bash
cd libs/frontend/shared-ui/ui-components
pnpm dlx shadcn@latest add [component]
```

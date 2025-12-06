# @reactive-platform/shared-ui-components

Shared component library built with shadcn/ui, Tailwind CSS, and CVA.

## Installation

The library is part of the Nx monorepo. Import components directly:

```typescript
import { Button, Input, Card } from '@reactive-platform/shared-ui-components';
```

## Available Components

| Component | Description |
|-----------|-------------|
| Button | Primary action component with variants |
| Input | Text input field |
| Label | Form label |
| Card | Container component with header/content/footer |
| Textarea | Multi-line text input |
| Checkbox | Checkbox input |

## CVA Pattern

All components use [Class Variance Authority (CVA)](https://cva.style/docs) for variant-based styling.

### Basic Pattern

```tsx
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/utils";

const buttonVariants = cva(
  // Base styles (always applied)
  "inline-flex items-center justify-center rounded-md font-medium",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground",
        secondary: "bg-secondary text-secondary-foreground",
        destructive: "bg-destructive text-destructive-foreground",
      },
      size: {
        sm: "h-9 px-3 text-sm",
        md: "h-10 px-4 text-base",
        lg: "h-11 px-6 text-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
);
```

## Token Usage

Components use design tokens from `@reactive-platform/shared-design-tokens`. Use semantic color names:

- `bg-background`, `text-foreground` - Page background/text
- `bg-primary`, `text-primary-foreground` - Primary actions
- `bg-muted`, `text-muted-foreground` - Secondary content
- `border-border` - Borders
- `bg-destructive` - Destructive actions

## Development

### Run Ladle (Component Stories)

```bash
pnpm nx ladle ui-components
```

### Run Unit Tests

```bash
pnpm nx test ui-components
```

### Run Visual Regression Tests (Playwright)

Visual regression tests use Playwright to capture and compare component screenshots.

```bash
# Run visual regression tests
pnpm nx e2e ui-components

# Update baseline snapshots (run when intentional visual changes are made)
pnpm nx e2e-update ui-components
```

**Note:** Only Chromium (latest version) is supported for visual regression testing. Snapshots are stored in `e2e/visual.spec.ts-snapshots/`.

### Generate New Component

```bash
pnpm nx g @reactive-platform/workspace-plugin:ui-component MyComponent
```

Options:
- `--description="..."` - Component description
- `--category=components|foundations|patterns` - Story category
- `--withStory=false` - Skip story generation
- `--withTest=false` - Skip test generation

## Adding shadcn/ui Components

```bash
cd libs/shared-ui/ui-components
pnpm dlx shadcn@latest add [component-name]
```

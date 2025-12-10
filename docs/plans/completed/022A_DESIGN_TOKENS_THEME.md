# 022A_DESIGN_TOKENS_THEME

**Status: DRAFT**

---

## Overview

Create the design token foundation with CSS custom properties, configure Tailwind CSS v4 wired to tokens, and document CVA (Class Variance Authority) patterns for component styling.

**Related Plans:**
- [022_DESIGN_SYSTEM_AND_COMPONENT_LIBRARY](./022_DESIGN_SYSTEM_AND_COMPONENT_LIBRARY.md) - Parent plan
- [022B_COMPONENT_LIBRARY](./022B_COMPONENT_LIBRARY.md) - Consumes tokens

---

## Goals

1. Create `libs/shared-design/tokens` package as single source of truth
2. Define semantic color tokens with light/dark theme support
3. Configure Tailwind v4 to consume CSS variable tokens
4. Establish CVA patterns for variant-based styling
5. Document token usage in library README and AGENTS.md

---

## References

**ADRs:**
- `docs/ADRs/008_component_library_design_system.md` - shadcn/ui + Tailwind decision

---

## Phase 1: Create Design Tokens Package

**Prereqs:** 020 Phase 1.1 complete (nx.json, pnpm workspace exists)
**Blockers:** None

### 1.1 Scaffold Tokens Library

**Files:**
- CREATE: `libs/shared-design/tokens/project.json`
- CREATE: `libs/shared-design/tokens/package.json`
- MODIFY: `tsconfig.base.json` (add path alias)

**Commands:**
```bash
# Create directory structure
mkdir -p libs/shared-design/tokens/src

# No Nx generator needed - this is a pure CSS package
```

**Implementation:**

`project.json`:
```json
{
  "name": "shared-design-tokens",
  "$schema": "../../../node_modules/nx/schemas/project-schema.json",
  "sourceRoot": "libs/shared-design/tokens/src",
  "projectType": "library",
  "tags": ["scope:shared", "type:lib", "platform:web"]
}
```

`package.json`:
```json
{
  "name": "@reactive-platform/shared-design-tokens",
  "version": "0.0.1",
  "main": "./src/index.css",
  "exports": {
    ".": "./src/index.css",
    "./colors": "./src/colors.css",
    "./spacing": "./src/spacing.css",
    "./typography": "./src/typography.css"
  }
}
```

### 1.2 Define Color Tokens

**Files:**
- CREATE: `libs/shared-design/tokens/src/colors.css`

**Implementation:**

```css
/* colors.css - Semantic color tokens with light/dark support */
@layer tokens {
  :root {
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

    /* Brand colors - customize per project */
    --color-brand-50: oklch(0.97 0.02 250);
    --color-brand-500: oklch(0.55 0.2 250);
    --color-brand-600: oklch(0.45 0.2 250);
    --color-brand-700: oklch(0.35 0.2 250);

    /* Semantic tokens (light mode) */
    --color-background: var(--color-gray-50);
    --color-foreground: var(--color-gray-900);
    --color-muted: var(--color-gray-100);
    --color-muted-foreground: var(--color-gray-500);
    --color-border: var(--color-gray-200);
    --color-input: var(--color-gray-200);
    --color-ring: var(--color-brand-500);

    --color-primary: var(--color-gray-900);
    --color-primary-foreground: var(--color-gray-50);
    --color-secondary: var(--color-gray-100);
    --color-secondary-foreground: var(--color-gray-900);

    --color-destructive: oklch(0.55 0.2 25);
    --color-destructive-foreground: var(--color-gray-50);

    --color-accent: var(--color-gray-100);
    --color-accent-foreground: var(--color-gray-900);
  }

  .dark {
    --color-background: var(--color-gray-950);
    --color-foreground: var(--color-gray-50);
    --color-muted: var(--color-gray-800);
    --color-muted-foreground: var(--color-gray-400);
    --color-border: var(--color-gray-800);
    --color-input: var(--color-gray-800);

    --color-primary: var(--color-gray-50);
    --color-primary-foreground: var(--color-gray-900);
    --color-secondary: var(--color-gray-800);
    --color-secondary-foreground: var(--color-gray-50);

    --color-accent: var(--color-gray-800);
    --color-accent-foreground: var(--color-gray-50);
  }
}
```

### 1.3 Define Spacing Tokens

**Files:**
- CREATE: `libs/shared-design/tokens/src/spacing.css`

**Implementation:**

```css
/* spacing.css - Consistent spacing scale */
@layer tokens {
  :root {
    --spacing-0: 0px;
    --spacing-px: 1px;
    --spacing-0-5: 0.125rem;  /* 2px */
    --spacing-1: 0.25rem;     /* 4px */
    --spacing-1-5: 0.375rem;  /* 6px */
    --spacing-2: 0.5rem;      /* 8px */
    --spacing-2-5: 0.625rem;  /* 10px */
    --spacing-3: 0.75rem;     /* 12px */
    --spacing-3-5: 0.875rem;  /* 14px */
    --spacing-4: 1rem;        /* 16px */
    --spacing-5: 1.25rem;     /* 20px */
    --spacing-6: 1.5rem;      /* 24px */
    --spacing-7: 1.75rem;     /* 28px */
    --spacing-8: 2rem;        /* 32px */
    --spacing-9: 2.25rem;     /* 36px */
    --spacing-10: 2.5rem;     /* 40px */
    --spacing-12: 3rem;       /* 48px */
    --spacing-14: 3.5rem;     /* 56px */
    --spacing-16: 4rem;       /* 64px */
    --spacing-20: 5rem;       /* 80px */
    --spacing-24: 6rem;       /* 96px */

    /* Component-specific spacing */
    --radius-sm: 0.125rem;
    --radius-md: 0.375rem;
    --radius-lg: 0.5rem;
    --radius-xl: 0.75rem;
    --radius-2xl: 1rem;
    --radius-full: 9999px;
  }
}
```

### 1.4 Define Typography Tokens

**Files:**
- CREATE: `libs/shared-design/tokens/src/typography.css`

**Implementation:**

```css
/* typography.css - Font families, sizes, weights, line heights */
@layer tokens {
  :root {
    /* Font families */
    --font-sans: ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji";
    --font-mono: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace;

    /* Font sizes */
    --text-xs: 0.75rem;       /* 12px */
    --text-sm: 0.875rem;      /* 14px */
    --text-base: 1rem;        /* 16px */
    --text-lg: 1.125rem;      /* 18px */
    --text-xl: 1.25rem;       /* 20px */
    --text-2xl: 1.5rem;       /* 24px */
    --text-3xl: 1.875rem;     /* 30px */
    --text-4xl: 2.25rem;      /* 36px */

    /* Line heights */
    --leading-none: 1;
    --leading-tight: 1.25;
    --leading-snug: 1.375;
    --leading-normal: 1.5;
    --leading-relaxed: 1.625;
    --leading-loose: 2;

    /* Font weights */
    --font-normal: 400;
    --font-medium: 500;
    --font-semibold: 600;
    --font-bold: 700;

    /* Letter spacing */
    --tracking-tighter: -0.05em;
    --tracking-tight: -0.025em;
    --tracking-normal: 0em;
    --tracking-wide: 0.025em;
  }
}
```

### 1.5 Define Shadow & Motion Tokens

**Files:**
- CREATE: `libs/shared-design/tokens/src/shadows.css`
- CREATE: `libs/shared-design/tokens/src/motion.css`

**Implementation (shadows.css):**

```css
/* shadows.css - Elevation tokens */
@layer tokens {
  :root {
    --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
    --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
    --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
    --shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
  }
}
```

**Implementation (motion.css):**

```css
/* motion.css - Animation tokens */
@layer tokens {
  :root {
    /* Durations */
    --duration-75: 75ms;
    --duration-100: 100ms;
    --duration-150: 150ms;
    --duration-200: 200ms;
    --duration-300: 300ms;
    --duration-500: 500ms;

    /* Easings */
    --ease-linear: linear;
    --ease-in: cubic-bezier(0.4, 0, 1, 1);
    --ease-out: cubic-bezier(0, 0, 0.2, 1);
    --ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
  }

  /* Respect user preference */
  @media (prefers-reduced-motion: reduce) {
    :root {
      --duration-75: 0ms;
      --duration-100: 0ms;
      --duration-150: 0ms;
      --duration-200: 0ms;
      --duration-300: 0ms;
      --duration-500: 0ms;
    }
  }
}
```

### 1.6 Create Index Export

**Files:**
- CREATE: `libs/shared-design/tokens/src/index.css`

**Implementation:**

```css
/* index.css - Aggregated token exports */
@import "./colors.css";
@import "./spacing.css";
@import "./typography.css";
@import "./shadows.css";
@import "./motion.css";
```

---

## Phase 2: Configure Tailwind v4

**Prereqs:** Phase 1 complete, libs/shared-ui scaffolded (from 022B Phase 1)
**Blockers:** None

### 2.1 Install Tailwind Dependencies

**Commands:**
```bash
pnpm add -D tailwindcss @tailwindcss/vite
```

### 2.2 Configure Tailwind with Tokens

**Files:**
- CREATE: `libs/shared-ui/ui-components/tailwind.config.ts`
- CREATE: `libs/shared-ui/ui-components/src/styles/globals.css`

**Implementation (tailwind.config.ts):**

```typescript
import type { Config } from "tailwindcss";

export default {
  darkMode: "class",
  content: [
    "./src/**/*.{ts,tsx}",
    "./stories/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--color-background)",
        foreground: "var(--color-foreground)",
        muted: {
          DEFAULT: "var(--color-muted)",
          foreground: "var(--color-muted-foreground)",
        },
        primary: {
          DEFAULT: "var(--color-primary)",
          foreground: "var(--color-primary-foreground)",
        },
        secondary: {
          DEFAULT: "var(--color-secondary)",
          foreground: "var(--color-secondary-foreground)",
        },
        destructive: {
          DEFAULT: "var(--color-destructive)",
          foreground: "var(--color-destructive-foreground)",
        },
        accent: {
          DEFAULT: "var(--color-accent)",
          foreground: "var(--color-accent-foreground)",
        },
        border: "var(--color-border)",
        input: "var(--color-input)",
        ring: "var(--color-ring)",
        brand: {
          50: "var(--color-brand-50)",
          500: "var(--color-brand-500)",
          600: "var(--color-brand-600)",
          700: "var(--color-brand-700)",
        },
      },
      borderRadius: {
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
        xl: "var(--radius-xl)",
        "2xl": "var(--radius-2xl)",
      },
      fontFamily: {
        sans: ["var(--font-sans)"],
        mono: ["var(--font-mono)"],
      },
      boxShadow: {
        sm: "var(--shadow-sm)",
        md: "var(--shadow-md)",
        lg: "var(--shadow-lg)",
        xl: "var(--shadow-xl)",
      },
      transitionDuration: {
        75: "var(--duration-75)",
        100: "var(--duration-100)",
        150: "var(--duration-150)",
        200: "var(--duration-200)",
        300: "var(--duration-300)",
        500: "var(--duration-500)",
      },
    },
  },
  plugins: [],
} satisfies Config;
```

**Implementation (globals.css):**

```css
@import "@reactive-platform/shared-design-tokens";
@import "tailwindcss";

@layer base {
  * {
    @apply border-border;
  }

  body {
    @apply bg-background text-foreground;
    font-family: var(--font-sans);
  }
}
```

---

## Phase 3: Document CVA Patterns

**Prereqs:** Tailwind configured
**Blockers:** None

### 3.1 Install CVA and Dependencies

**Commands:**
```bash
pnpm add class-variance-authority clsx tailwind-merge
```

### 3.2 Create Utility Functions

**Files:**
- CREATE: `libs/shared-ui/ui-components/src/lib/utils.ts`

**Implementation:**

```typescript
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge Tailwind classes with conflict resolution.
 * Use this for all className props in components.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

### 3.3 Document CVA Patterns in README

**Files:**
- CREATE: `libs/shared-ui/ui-components/README.md`

**Implementation:**

```markdown
# @reactive-platform/shared-ui-components

Shared component library built with shadcn/ui, Tailwind CSS, and CVA.

## CVA Pattern

All components use [Class Variance Authority (CVA)](https://cva.style/docs) for variant-based styling.

### Basic Pattern

```tsx
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/utils";

const buttonVariants = cva(
  // Base styles (always applied)
  "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent",
        ghost: "hover:bg-accent hover:text-accent-foreground",
      },
      size: {
        sm: "h-8 px-3 text-xs",
        md: "h-9 px-4 text-sm",
        lg: "h-10 px-6 text-base",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
);

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return (
    <button className={cn(buttonVariants({ variant, size }), className)} {...props} />
  );
}
```

### Rules

1. **Base styles first** - Styles that apply to all variants
2. **Variants object** - Each variant dimension (variant, size, etc.)
3. **Default variants** - Fallback values when props not provided
4. **Use cn() for className** - Always merge with passed className prop
5. **Export variants** - Export `buttonVariants` for compound components

### Compound Variants

For styles that depend on multiple variant combinations:

```tsx
const alertVariants = cva("rounded-lg border p-4", {
  variants: {
    variant: { info: "border-blue-200", error: "border-red-200" },
    size: { sm: "text-sm", lg: "text-base" },
  },
  compoundVariants: [
    { variant: "error", size: "lg", class: "border-2" },
  ],
});
```

## Token Usage

Import design tokens via the globals.css which includes `@reactive-platform/shared-design-tokens`.

Use semantic color names in Tailwind classes:
- `bg-background`, `text-foreground` - Page background/text
- `bg-primary`, `text-primary-foreground` - Primary actions
- `bg-muted`, `text-muted-foreground` - Secondary content
- `border-border` - Borders
- `bg-destructive` - Destructive actions

## Adding Components

```bash
# From ui-components directory
pnpm dlx shadcn@latest add button
```
```

---

## Phase 4: Create AGENTS.md and Documentation

**Prereqs:** Phases 1-3 complete
**Blockers:** None

### 4.1 Create Design Tokens AGENTS.md

**Files:**
- CREATE: `libs/shared-design/tokens/AGENTS.md`

**Implementation:**

```markdown
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
```

---

## Files Summary

| Action | File | Purpose |
|--------|------|---------|
| CREATE | `libs/shared-design/tokens/project.json` | Nx project config |
| CREATE | `libs/shared-design/tokens/package.json` | Package manifest |
| CREATE | `libs/shared-design/tokens/src/colors.css` | Color tokens |
| CREATE | `libs/shared-design/tokens/src/spacing.css` | Spacing tokens |
| CREATE | `libs/shared-design/tokens/src/typography.css` | Typography tokens |
| CREATE | `libs/shared-design/tokens/src/shadows.css` | Shadow tokens |
| CREATE | `libs/shared-design/tokens/src/motion.css` | Motion tokens |
| CREATE | `libs/shared-design/tokens/src/index.css` | Aggregated export |
| CREATE | `libs/shared-design/tokens/AGENTS.md` | AI guidance |
| CREATE | `libs/shared-ui/ui-components/tailwind.config.ts` | Tailwind config |
| CREATE | `libs/shared-ui/ui-components/src/styles/globals.css` | Global styles |
| CREATE | `libs/shared-ui/ui-components/src/lib/utils.ts` | cn() utility |
| CREATE | `libs/shared-ui/ui-components/README.md` | Library docs |
| MODIFY | `tsconfig.base.json` | Add path aliases |

---

## Documentation Updates

| File | Update Required |
|------|-----------------|
| `CLAUDE.md` | Add shared-design/tokens to module overview |
| `tsconfig.base.json` | Add `@reactive-platform/shared-design-tokens` path |

---

## Checklist

- [ ] Phase 1: Design tokens package created
- [ ] Phase 2: Tailwind v4 configured with tokens
- [ ] Phase 3: CVA patterns documented
- [ ] Phase 4: AGENTS.md created
- [ ] Path aliases configured in tsconfig.base.json

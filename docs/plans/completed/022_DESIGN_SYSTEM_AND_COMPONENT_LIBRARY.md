# 022_DESIGN_SYSTEM_AND_COMPONENT_LIBRARY

**Status: COMPLETE**

---

## Overview

Establish a comprehensive design system with design tokens/theming and a shadcn/ui-based component library. This initiative creates the shared UI foundation for all frontend applications in the Nx monorepo, with accessibility baked in and Ladle stories for documentation.

**Prerequisites:**
- `020_NX_MONOREPO_IMPLEMENTATION.md` Phase 1.1 complete (pnpm, package.json, nx.json)
- `021B_FRONTEND_STANDARDS.md` complete (components.md standard exists)

**Related ADRs:**
- `docs/ADRs/008_component_library_design_system.md` - shadcn/ui + Tailwind decision

---

## Goals

1. Create design token source of truth with CSS variables (colors, spacing, typography)
2. Configure Tailwind CSS v4 wired to design tokens
3. Set up shared-ui library with shadcn/ui CLI and CVA patterns
4. Build core primitives (Button, Input, Card, Modal, Form controls) with WCAG accessibility
5. Organize Ladle stories by domain (Foundations, Components, Patterns)
6. Configure testing with Vitest + RTL + axe-core
7. Create custom Nx generators for component scaffolding
8. Optional: Add Playwright visual regression tests

---

## Sub-Plans

| Plan | Scope | Est. Lines |
|------|-------|------------|
| [022A_DESIGN_TOKENS_THEME](./022A_DESIGN_TOKENS_THEME.md) | Design tokens, Tailwind v4 config, CVA setup, CSS variables | ~350 |
| [022B_COMPONENT_LIBRARY](./022B_COMPONENT_LIBRARY.md) | shadcn/ui components, Ladle stories, tests, Nx generators | ~450 |

---

## Architecture

```
libs/
├── shared-design/                    # Design tokens package
│   └── tokens/
│       ├── src/
│       │   ├── colors.css            # Color primitives + semantic
│       │   ├── spacing.css           # Spacing scale
│       │   ├── typography.css        # Font families, sizes, weights
│       │   ├── shadows.css           # Elevation tokens
│       │   ├── motion.css            # Animation/transition tokens
│       │   └── index.css             # Aggregated exports
│       ├── project.json
│       └── package.json
│
├── shared-ui/
│   └── ui-components/                # Component library
│       ├── src/
│       │   ├── components/
│       │   │   └── ui/               # shadcn/ui components
│       │   │       ├── button.tsx
│       │   │       ├── input.tsx
│       │   │       ├── card.tsx
│       │   │       ├── dialog.tsx
│       │   │       └── ...
│       │   ├── lib/
│       │   │   └── utils.ts          # cn() helper
│       │   └── index.ts              # Public API
│       ├── .ladle/
│       │   └── config.mjs            # Ladle config
│       ├── stories/                  # Ladle stories
│       │   ├── foundations/          # Tokens, colors, typography
│       │   ├── components/           # Individual components
│       │   └── patterns/             # Composed patterns
│       ├── components.json           # shadcn/ui config
│       ├── tailwind.config.ts        # Wired to tokens
│       ├── project.json
│       └── package.json
│
tools/
└── workspace-plugin/                 # Custom Nx generators
    ├── src/
    │   └── generators/
    │       ├── ui-component/         # Component + story + test
    │       └── design-token/         # Add new token category
    ├── generators.json
    └── package.json
```

### Package Naming

| Module | Package/Import |
|--------|----------------|
| Design tokens | `@reactive-platform/shared-design-tokens` |
| UI components | `@reactive-platform/shared-ui-components` |
| Workspace plugin | `@reactive-platform/workspace-plugin` |

---

## Dependency Graph

```
020 Phase 1.1 (pnpm, nx.json)
         │
         ▼
021B (frontend standards)
         │
    ┌────┴────┐
    │         │
    ▼         │
  022A        │
(tokens)      │
    │         │
    └────┬────┘
         │
         ▼
       022B
  (components)
```

**Note:** 022A must complete before 022B (components depend on tokens).

---

## CLI Tools & Generators

### External CLI Tools (run via pnpm dlx)

| Tool | Command | Purpose |
|------|---------|---------|
| shadcn | `pnpm dlx shadcn@latest init` | Initialize shadcn/ui config |
| shadcn | `pnpm dlx shadcn@latest add [component]` | Add components |

### Nx Generators (from @nx/* packages)

| Generator | Command | Purpose |
|-----------|---------|---------|
| React lib | `nx g @nx/react:lib` | Create shared-ui library |
| Tailwind | `nx g @nx/react:setup-tailwind` | Add Tailwind to project |
| Vitest | `nx g @nx/vite:vitest` | Add Vitest testing |
| Plugin | `nx g @nx/plugin:plugin` | Create workspace plugin |

### Custom Generators (created in 022B)

| Generator | Command | Purpose |
|-----------|---------|---------|
| ui-component | `nx g @reactive-platform/workspace-plugin:ui-component` | Scaffold component + story + test |
| design-token | `nx g @reactive-platform/workspace-plugin:design-token` | Add new token category |

---

## Checklist

- [x] 022A: Design tokens package created
- [x] 022A: Tailwind v4 configured with tokens
- [x] 022A: CVA patterns documented
- [x] 022B: shared-ui library scaffolded
- [x] 022B: Core primitives implemented (Button, Input, Card, Label, Textarea, Checkbox)
- [x] 022B: Ladle stories organized by domain
- [x] 022B: All components pass axe-core checks
- [x] 022B: Custom Nx generators operational
- [x] 022B: Playwright visual regression tests (Chromium only)
- [x] Documentation updated (CLAUDE.md, library READMEs, AGENTS.md)

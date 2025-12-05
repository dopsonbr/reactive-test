# Component Library & Design System

* Status: proposed
* Deciders: Platform Team, Frontend Team
* Date: 2025-12-06

## Context and Problem Statement

With the frontend stack chosen (React + Vite + TanStack Router + TanStack Query, client-only), we need a shared component library and design system that can serve multiple applications (e-commerce, POS, admin, merchandising, order management) without introducing a production Node/BFF dependency. The library must be composable, accessible, browser-first, and easy to consume across apps in the Nx monorepo while keeping frontend and backend strictly separated.

## Constraints

- Client-only deployment: static assets; no Node server required at runtime.
- Strict frontend/backend separation; backend concerns stay in Spring services.
- Multiple apps share the same library; avoid app-specific forks.
- React/Vite/TanStack Router/Query baseline; no Redux/NgRx; minimal client global state.
- Nx monorepo: generators/affected analysis should work for components and tokens.
- Browser-first: prefer native capabilities (fetch, Intl, forms) over bespoke shims.

## Guiding Principles (from frontend standards)

- Composable, prop-driven components; presentational parts are logic-free.
- Cross-cutting concerns (auth, telemetry, analytics) live in shared hooks/services, not in UI primitives.
- Accessibility-first defaults (ARIA, focus management, keyboard support).
- Routable surfaces: views/pages must be addressable; components support layout/routing patterns.
- Code sharing across all frontends; avoid divergent theming or styling stacks per app.
- Type safety with TypeScript and generated API types where applicable.
- Performance and DX: fast HMR, small bundles, code-splitting by route/feature.

## Decision Criteria

1. **Design tokens and theming**: CSS variables/theme tokens with light/dark and brand extensibility; no per-app hard forks. Tokens generated/validated via Nx pipelines.
2. **Component model**: Headless or low-opinion primitives that are composition-friendly; avoid tightly coupled “kitchen sink” components. Styling should be swappable (e.g., CSS variables, utility classes).
3. **Accessibility**: Built-in ARIA roles, focus management, keyboard navigation, and form semantics. Must pass axe checks out of the box.
4. **Type safety**: Strict TypeScript types for props, slots, and theming contracts; minimal reliance on `any`.
5. **Cross-app compatibility**: Works for web, POS, and admin surfaces; no runtime that assumes SSR. Must deploy as static assets with Vite builds.
6. **Routing alignment**: Plays well with TanStack Router (or React Router) for layouts, navigation components, and link handling without requiring SSR.
7. **State boundaries**: Components stay presentational; data fetching/mutations live in hooks/services (TanStack Query). No bundled global state managers.
8. **Theming + design consistency**: Single source of truth for typography, spacing, color, and motion tokens; Storybook-like previews for validation.
9. **Performance**: Tree-shakeable, minimal runtime, avoids heavy peer deps. Supports code-splitting and lazy loading where appropriate.
10. **Ecosystem and maintenance**: Actively maintained upstream (if adopting a headless kit) with permissive licensing; strong documentation and community support.
11. **Testing**: Components are testable with RTL + axe; provide fixtures/mocks to make adoption easy across apps.

## Options (to evaluate against criteria)

- Headless primitives (e.g., Radix UI) + custom theming layer (high composability, strong accessibility)
- Utility-first styling (e.g., Tailwind) + headless components (fast styling, consistent tokens via CSS vars)
- Minimal in-house headless primitives + tokens (maximum control, higher maintenance)
- Full UI kits:
  - **MUI** (largest LLM/AI footprint, mature theming, rich components; heavier runtime)
  - **Ant Design** (enterprise-friendly, strong data components; LLM familiarity good but less than MUI)
  - **shadcn/ui (Radix + Tailwind)** (codegen per project, high composability; lighter ecosystem support, per-app sync risk)
  - **Chakra** (simpler theming, smaller ecosystem than MUI/AntD)

## Status / Next Steps

- Score the options above against the criteria.
- Prototype token pipeline (CSS vars) and a small component set (Button, Input, Modal) in Nx to validate DX and bundle size.
- Decide on the headless vs. full-kit direction; document chosen library and migration guidance.

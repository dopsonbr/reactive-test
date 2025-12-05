# Frontend Guiding Principles

Principles to guide framework/tooling decisions and day-to-day implementation for React-based apps in the monorepo.

## Design System and Composition
- Single design system per repo: shared tokens, theming, primitives, and patterns consumed by all apps.
- Favor prop-driven composition over inheritance; presentational components stay logic-free and reusable.
- All UI elements accessible by default (keyboard, ARIA, focus), with Storybook-like previews required for new primitives.

## Smart vs. Presentational
- Container (smart) components own side effects: data fetching, mutations, navigation, and orchestration.
- Presentational (dumb) components remain pure, stateless where possible, and accept data/handlers via props.
- Keep side effects in hooks/services at the edges; render trees stay predictable and testable.

## State and Data
- Prefer server state libraries (e.g., React Query/RTK Query) over global stores; no Redux/NgRx.
- Co-locate state with features; lift only when necessary. Derive rather than duplicate state.
- Keep URL as state: routes capture navigation and filter/query params for shareable links.

## Routing
- Everything routable: each feature view should be addressable/deeplinkable with nested/layout routes.
- Use a single router per app; colocate data requirements with routes and apply code-splitting by route/feature.

## Cross-Cutting Concerns
- Share orthogonal concerns via libraries/hooks: auth, telemetry/logging, analytics, feature flags, error handling.
- Provide HTTP client wrappers/interceptors once; forbid per-app reinvention.
- Standardize request/response typing via generated API clients and shared type packages.

## Code Sharing Across Apps
- Prioritize shared packages (design system, data clients, utilities) consumable by multiple frontends.
- Enforce compatibility across apps (web, POS, admin) via semver and CI checks on shared libs.
- Avoid app-specific forks of shared code; if divergence is needed, extract configuration rather than duplicating implementations.

## Browser-First
- Prefer platform capabilities before libraries: `fetch`, `URLSearchParams`, `AbortController`, `Intl`, native form validation, Web Crypto.
- Keep polyfills deliberate and documented; no bespoke wrappers unless value is proven.

## Performance and DX
- Require TypeScript with generated API types. Enforce lint/format/test on save in dev.
- Code-split by route/feature, optimize images/fonts, and keep bundles cacheable.
- Favor fast HMR/hot reload paths and minimal custom build plumbing; integrate cleanly with Nx.

## Testing and Quality
- Test pyramid: unit (pure components/functions) → integration (route/feature) → E2E.
- Accessibility-first testing (axe/ARIA) for shared components.
- Telemetry/logging behaviors covered by integration tests where applicable.

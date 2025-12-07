 Findings

  - [P1] docs/standards/frontend/code-organization.md:18-37 – Nx library layout still uses libs/shared-ui, libs/shared-data, libs/shared-utils (no frontend/ prefix) which don’t exist; current structure is libs/frontend/{shared-ui,shared-
    data,shared-design}, so the guidance sends contributors to nonexistent paths.
  - [P1] docs/standards/frontend/code-organization.md:92-106 – The path alias sample points to libs/shared-ui/*/src/index.ts and similar, but tsconfig.base.json maps to libs/frontend/... and also exposes @reactive-platform/shared-ui-components;
    following the doc would produce broken imports/tsconfig updates.
  - [P2] docs/standards/frontend/testing.md:28-32 – Hooks testing is prescribed with @testing-library/react-hooks, which isn’t in dependencies and is deprecated; the repo currently only ships RTL/Vitest, so the recommended toolchain is
    inaccurate.
  - [P2] docs/standards/frontend/observability.md:123-124 – Reference to libs/shared-utils/logger/ points to a non-existent package; there’s no frontend logger library at that path, so the “Reference” section currently dead-ends.

  Open Questions

  - Where should the standards point for shared logging utilities on the frontend (or should we explicitly note “pending” until such a package exists)?
  - Which hooks testing utility should be the blessed option (RTL’s renderHook via @testing-library/react, or do we want to add a dedicated package)?
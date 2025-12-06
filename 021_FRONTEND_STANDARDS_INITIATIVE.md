# 021_FRONTEND_STANDARDS_INITIATIVE

**Status: COMPLETE**

---

## Overview

Parent plan for establishing frontend standards, templates, and tooling for the polyglot Nx monorepo. This initiative is split into independently mergeable sub-plans.

**Prerequisites:**
- `020_NX_MONOREPO_IMPLEMENTATION.md` Phase 1.1 complete (pnpm workspace, `package.json` exists)

**Related ADRs:**
- `docs/ADRs/006_frontend_monorepo_strategy.md` - Nx polyglot strategy
- `docs/ADRs/007_frontend_ui_framework.md` - React + Vite + TanStack
- `docs/ADRs/008_component_library_design_system.md` - shadcn/ui + Tailwind
- `docs/ADRs/009_frontend_testing_strategy.md` - Ladle + Vitest + Playwright

## Goals

1. Reorganize standards/templates into `backend/` and `frontend/` subdirectories
2. Create frontend-specific standards (error handling, observability, testing, components)
3. Configure Nx module boundary rules with `@nx/enforce-module-boundaries`
4. Create frontend code templates (components, hooks, pages)
5. Redesign AGENTS.md templates for progressive disclosure
6. Add markdown linting with `markdownlint-cli2`

---

## Sub-Plans

Execute in order. Each sub-plan is independently branchable and mergeable.

| Sub-Plan | Scope | Lines | Prereqs |
|----------|-------|-------|---------|
| [021A_STANDARDS_REORG](./021A_STANDARDS_REORG.md) | Move backend standards/templates, update indexes, redesign doc templates | ~200 | None |
| [021B_FRONTEND_STANDARDS](./021B_FRONTEND_STANDARDS.md) | Create 7 frontend standards documents | ~350 | 021A |
| [021C_FRONTEND_TEMPLATES](./021C_FRONTEND_TEMPLATES.md) | Create 6 frontend code templates | ~400 | 021B |
| [021D_MODULE_BOUNDARIES](./021D_MODULE_BOUNDARIES.md) | Configure ESLint `@nx/enforce-module-boundaries` | ~150 | 020 Phase 1.1 |
| [021E_MARKDOWN_LINT](./021E_MARKDOWN_LINT.md) | Install and configure `markdownlint-cli2` | ~100 | 020 Phase 1.1 |

---

## Architecture (Target State)

```
docs/
├── standards/
│   ├── README.md                    # Index (updated)
│   ├── CONTENTS.md                  # Updated index
│   ├── documentation.md             # Shared (both ecosystems)
│   ├── code-style.md                # Shared principles
│   ├── backend/                     # Backend-specific (moved)
│   │   └── *.md                     # 16 files
│   └── frontend/                    # Frontend-specific (new)
│       └── *.md                     # 7 files
├── templates/
│   ├── README.md                    # Index (updated)
│   ├── _template_agents.md          # Shared (redesigned)
│   ├── _template_readme.md          # Shared
│   ├── _template_contents.md        # Shared
│   ├── backend/                     # Backend-specific (moved)
│   │   └── _template_*.md           # 4 files
│   └── frontend/                    # Frontend-specific (new)
│       └── _template_*.md           # 6 files
tools/
└── verify-docs-index.sh             # Index sync verification
```

---

## Dependency Graph

```
                    020 Phase 1.1
                    (pnpm, package.json)
                          │
          ┌───────────────┼───────────────┐
          │               │               │
          ▼               ▼               ▼
    021A_REORG      021D_BOUNDARIES  021E_LINT
          │
          ▼
    021B_STANDARDS
          │
          ▼
    021C_TEMPLATES
```

---

## Checklist

- [x] 021A: Standards reorganization complete
- [x] 021B: Frontend standards created
- [x] 021C: Frontend templates created
- [x] 021D: Module boundaries configured
- [x] 021E: Markdown linting operational
- [x] All index files in sync (run `tools/verify-docs-index.sh`)

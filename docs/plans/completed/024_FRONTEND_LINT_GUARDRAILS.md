# 024_FRONTEND_LINT_GUARDRAILS

**Status: COMPLETE**

---

## Overview

Encode frontend standards as automated checks that fail fast in CI. This initiative adds ESLint rules (module boundaries + custom plugin), Stylelint/Tailwind token enforcement, story/a11y coverage checks, and unified lint orchestration.

**Prerequisites:**
- `020_NX_MONOREPO_IMPLEMENTATION.md` Phase 1.1 complete (pnpm, package.json, nx.json)
- `021D_MODULE_BOUNDARIES.md` complete (base ESLint flat config exists)

---

## Goals

1. Enforce module boundaries via `@nx/enforce-module-boundaries`
2. Create custom ESLint plugin (`eslint-plugin-reactive`) for design tokens, barrels, a11y, TanStack Query
3. Add Stylelint/Tailwind plugin to ban arbitrary values and enforce tokens
4. Ensure every UI component has a Ladle story and axe test
5. Ensure feature components have co-located `.test.tsx` and mock fixtures
6. Wire all checks into CI with clear failure messages
7. Provide `pnpm lint:all` for local pre-PR validation

---

## Sub-Plans

| Plan | Scope | Lines |
|------|-------|-------|
| [024A_ESLINT_BOUNDARIES](./024A_ESLINT_BOUNDARIES.md) | ESLint flat config, module boundaries, custom plugin | ~400 |
| [024B_DESIGN_TOKEN_STYLELINT](./024B_DESIGN_TOKEN_STYLELINT.md) | Stylelint, Tailwind plugin, token enforcement | ~250 |
| [024C_STORY_A11Y_ENFORCEMENT](./024C_STORY_A11Y_ENFORCEMENT.md) | Story coverage, axe tests, test co-location | ~300 |
| [024D_LINT_CI_INTEGRATION](./024D_LINT_CI_INTEGRATION.md) | CI wiring, lint:all, check-frontend.sh, docs | ~350 |

---

## Dependency Graph

```
020 Phase 1.1 (pnpm, package.json)
         │
         ▼
021D (ESLint base config)
         │
    ┌────┴────┬─────────────┐
    │         │             │
    ▼         ▼             ▼
  024A      024B          024C
(ESLint)  (Stylelint)  (Story/Test)
    │         │             │
    └─────────┴──────┬──────┘
                     │
                     ▼
                   024D
            (CI + lint:all + docs)
```

**Parallel Execution:**
- 024A, 024B, 024C can run in parallel after 021D completes
- 024D depends on all three completing

---

## Exit Criteria (Initiative-Level)

- [x] `nx lint` catches module boundary violations
- [x] Custom ESLint rules enforce design tokens, no barrel exports, a11y patterns, TanStack Query guardrails
- [x] Stylelint bans arbitrary Tailwind values and inline styles
- [x] Missing story or axe test fails lint
- [x] Missing feature test co-location fails lint
- [x] `pnpm lint:all` runs all checks locally
- [x] CI fails on any lint violation
- [x] AGENTS.md documents lint expectations

---

## Files Summary (All Sub-Plans)

| Action | File | Sub-Plan |
|--------|------|----------|
| CREATE | `tools/eslint-plugin-reactive/` | 024A |
| MODIFY | `eslint.config.js` | 024A |
| CREATE | `.stylelintrc.json` | 024B |
| CREATE | `tools/lint-stories.ts` | 024C |
| CREATE | `tools/lint-tests.ts` | 024C |
| CREATE | `tools/check-frontend.sh` | 024D |
| CREATE | `.github/workflows/lint.yml` | 024D |
| MODIFY | `package.json` | 024D |
| MODIFY | `AGENTS.md` | 024D |

---

## Checklist

- [x] 024A complete: ESLint + custom plugin working
- [x] 024B complete: Stylelint + Tailwind enforcement working
- [x] 024C complete: Story/test enforcement working
- [x] 024D complete: CI + lint:all + docs updated
- [x] All checks pass on existing codebase (or violations fixed)

# 061_OFFLINE_POS_E2E_RESTRUCTURE

**Status: COMPLETE**

---

## Overview

Move the offline-pos e2e tests from `apps/offline-pos/e2e/` to a standalone Nx project at `apps/offline-pos-e2e/` to follow repository conventions. This aligns the Go-based offline-pos application with the standard Nx e2e project structure used by other applications.

## Goals

1. Create `apps/offline-pos-e2e/` as a proper Nx project with `project.json`
2. Migrate existing tests and fixtures to the new location
3. Remove the nested e2e directory from `apps/offline-pos/`
4. Enable Nx task orchestration (`pnpm nx e2e offline-pos-e2e`)

## References

**Standards:**
- `docs/standards/frontend/testing.md` - E2E testing patterns

**Completed Plans:**
- `docs/plans/completed/053_E2E_TEST_CONSOLIDATION.md` - Establishes the e2e project patterns

## Architecture

```
Before:                              After:
apps/                                apps/
├── offline-pos/                     ├── offline-pos/
│   ├── e2e/          ← REMOVE       │   └── (Go app only)
│   │   ├── package.json             │
│   │   ├── playwright.config.ts     ├── offline-pos-e2e/    ← NEW
│   │   └── specs/                   │   ├── project.json
│   │       └── full-transaction.ts  │   ├── playwright.config.ts
│   └── (Go app)                     │   └── specs/
│                                    │       └── full-transaction.spec.ts
```

### Dependency Order

```
Phase 1: Create new project
        │
        ▼
Phase 2: Migrate tests
        │
        ▼
Phase 3: Cleanup old location
```

---

## Phase 1: Create New E2E Project

**Prereqs:** None
**Blockers:** None

### 1.1 Create Project Structure

**Files:**
- CREATE: `apps/offline-pos-e2e/project.json`
- CREATE: `apps/offline-pos-e2e/tsconfig.json`

**Implementation:**

`apps/offline-pos-e2e/project.json`:
```json
{
  "name": "offline-pos-e2e",
  "$schema": "../../node_modules/nx/schemas/project-schema.json",
  "projectType": "application",
  "sourceRoot": "apps/offline-pos-e2e",
  "implicitDependencies": ["offline-pos"],
  "tags": ["type:e2e", "scope:offline-pos", "platform:fullstack"],
  "targets": {
    "e2e": {
      "executor": "@nx/playwright:playwright",
      "outputs": ["{workspaceRoot}/dist/.playwright/apps/offline-pos-e2e"],
      "options": {
        "config": "apps/offline-pos-e2e/playwright.config.ts"
      }
    }
  }
}
```

`apps/offline-pos-e2e/tsconfig.json`:
```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "module": "ESNext",
    "moduleResolution": "bundler",
    "types": ["node"]
  },
  "include": ["**/*.ts"]
}
```

---

## Phase 2: Migrate Tests

**Prereqs:** Phase 1 complete
**Blockers:** None

### 2.1 Move Playwright Config

**Files:**
- MOVE: `apps/offline-pos/e2e/playwright.config.ts` → `apps/offline-pos-e2e/playwright.config.ts`

**Implementation:**
- Copy file to new location
- Update `testDir` to `./specs`
- Update `outputDir` to use Nx outputs path

### 2.2 Move Test Specs

**Files:**
- MOVE: `apps/offline-pos/e2e/specs/full-transaction.spec.ts` → `apps/offline-pos-e2e/specs/full-transaction.spec.ts`

**Implementation:**
- Copy spec file to new location
- Update any relative imports if present

---

## Phase 3: Cleanup

**Prereqs:** Phase 2 complete, verify tests run with `pnpm nx e2e offline-pos-e2e`
**Blockers:** None

### 3.1 Remove Old E2E Directory

**Files:**
- DELETE: `apps/offline-pos/e2e/` (entire directory)

**Implementation:**
- Delete `apps/offline-pos/e2e/package.json`
- Delete `apps/offline-pos/e2e/playwright.config.ts`
- Delete `apps/offline-pos/e2e/specs/` directory

---

## Files Summary

| Action | File | Purpose |
|--------|------|---------|
| CREATE | `apps/offline-pos-e2e/project.json` | Nx project config |
| CREATE | `apps/offline-pos-e2e/tsconfig.json` | TypeScript config |
| MOVE | `apps/offline-pos-e2e/playwright.config.ts` | Playwright config |
| MOVE | `apps/offline-pos-e2e/specs/full-transaction.spec.ts` | Test specs |
| DELETE | `apps/offline-pos/e2e/` | Old nested e2e directory |

---

## Testing Strategy

1. After Phase 2, verify: `pnpm nx e2e offline-pos-e2e` (requires offline-pos Go app running on :3000)
2. After Phase 3, verify: `pnpm nx show project offline-pos-e2e` shows the project

---

## Checklist

- [x] Phase 1: Create project structure
- [x] Phase 2: Migrate tests
- [x] Phase 3: Cleanup old location
- [x] Verify `pnpm nx e2e offline-pos-e2e` works

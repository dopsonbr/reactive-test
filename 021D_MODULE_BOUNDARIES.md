# 021D_MODULE_BOUNDARIES

**Status: DRAFT**

---

## Overview

Configure ESLint `@nx/enforce-module-boundaries` rule for frontend module dependency enforcement. Backend Java boundaries use ArchUnit (separate concern).

**Parent Plan:** [021_FRONTEND_STANDARDS_INITIATIVE](./021_FRONTEND_STANDARDS_INITIATIVE.md)

**Prerequisites:**
- `020_NX_MONOREPO_IMPLEMENTATION.md` Phase 1.1 complete (Nx workspace initialized)

**Blockers:**
- `eslint.config.js` must exist (created in 020)
- `@nx/eslint-plugin` must be installed

---

## Goals

1. Configure `@nx/enforce-module-boundaries` in flat ESLint config
2. Define type-based and scope-based tag conventions
3. Document tagging patterns for projects

---

## Exit Criteria

- [ ] `eslint.config.js` contains module boundary rules
- [ ] `nx lint` catches boundary violations
- [ ] Tag conventions documented in this plan

---

## Phase 1: ESLint Configuration

**Prereqs:** `eslint.config.js` exists, `@nx/eslint-plugin` installed

**File:** `eslint.config.js` (root, flat config)

**Implementation:**
```javascript
// eslint.config.js
const nx = require('@nx/eslint-plugin');

module.exports = [
  ...nx.configs['flat/base'],
  ...nx.configs['flat/typescript'],
  ...nx.configs['flat/javascript'],
  {
    ignores: ['**/dist', '**/build', '**/node_modules', '**/target'],
  },
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    rules: {
      '@nx/enforce-module-boundaries': [
        'error',
        {
          enforceBuildableLibDependency: true,
          allow: [],
          depConstraints: [
            // Type-based constraints
            {
              sourceTag: 'type:app',
              onlyDependOnLibsWithTags: ['type:feature', 'type:ui', 'type:data-access', 'type:util', 'type:model'],
            },
            {
              sourceTag: 'type:feature',
              onlyDependOnLibsWithTags: ['type:feature', 'type:ui', 'type:data-access', 'type:util', 'type:model'],
            },
            {
              sourceTag: 'type:ui',
              onlyDependOnLibsWithTags: ['type:ui', 'type:util', 'type:model'],
            },
            {
              sourceTag: 'type:data-access',
              onlyDependOnLibsWithTags: ['type:data-access', 'type:util', 'type:model'],
            },
            {
              sourceTag: 'type:util',
              onlyDependOnLibsWithTags: ['type:util', 'type:model'],
            },
            {
              sourceTag: 'type:model',
              onlyDependOnLibsWithTags: ['type:model'],
            },
            // Scope-based constraints
            {
              sourceTag: 'scope:shared',
              onlyDependOnLibsWithTags: ['scope:shared'],
            },
            {
              sourceTag: 'scope:ecommerce',
              onlyDependOnLibsWithTags: ['scope:ecommerce', 'scope:shared'],
            },
            {
              sourceTag: 'scope:pos',
              onlyDependOnLibsWithTags: ['scope:pos', 'scope:shared'],
            },
            {
              sourceTag: 'scope:admin',
              onlyDependOnLibsWithTags: ['scope:admin', 'scope:shared'],
            },
          ],
        },
      ],
    },
  },
];
```

**Note:** `@nx/enforce-module-boundaries` only analyzes JS/TS imports. Java module boundaries are enforced via ArchUnit tests.

---

## Phase 2: Tag Conventions

### Type Tags (Library Purpose)

| Tag | Purpose | Can Depend On |
|-----|---------|---------------|
| `type:app` | Deployable application | feature, ui, data-access, util, model |
| `type:feature` | Business feature | feature, ui, data-access, util, model |
| `type:ui` | Presentational components | ui, util, model |
| `type:data-access` | API/data layer | data-access, util, model |
| `type:util` | Pure utility functions | util, model |
| `type:model` | Types/interfaces only | model |

### Scope Tags (Domain Boundary)

| Tag | Purpose | Can Depend On |
|-----|---------|---------------|
| `scope:shared` | Cross-domain code | shared only |
| `scope:ecommerce` | E-commerce domain | ecommerce, shared |
| `scope:pos` | Point-of-sale domain | pos, shared |
| `scope:admin` | Admin domain | admin, shared |

---

## Phase 3: Project Tagging Examples

**Prereqs:** Projects exist in `libs/` and `apps/`

### Example project.json Configurations

```json
// libs/shared-ui/button/project.json
{
  "tags": ["scope:shared", "type:ui"]
}

// libs/shared-data/api-client/project.json
{
  "tags": ["scope:shared", "type:data-access"]
}

// libs/ecommerce-feature-cart/project.json
{
  "tags": ["scope:ecommerce", "type:feature"]
}

// apps/ecommerce-web/project.json
{
  "tags": ["scope:ecommerce", "type:app"]
}

// apps/pos-web/project.json
{
  "tags": ["scope:pos", "type:app"]
}
```

### Tag Assignment Reference

| Project Type | Tags |
|--------------|------|
| Frontend app | `scope:{domain}`, `type:app` |
| Feature lib | `scope:{domain}`, `type:feature` |
| Shared UI lib | `scope:shared`, `type:ui` |
| Data access lib | `scope:shared`, `type:data-access` |
| Utility lib | `scope:shared`, `type:util` |
| Type/model lib | `scope:shared`, `type:model` |

---

## Phase 4: Verification

**Commands:**
```bash
# Lint all projects
nx run-many -t lint

# Check specific project
nx lint ecommerce-web

# Visualize dependency graph
nx graph
```

**Expected Error (when boundary violated):**
```
error: A project tagged with "type:ui" can only depend on libs tagged with "type:ui", "type:util", "type:model"
```

---

## Files Summary

| Action | File | Purpose |
|--------|------|---------|
| MODIFY | `eslint.config.js` | Add @nx/enforce-module-boundaries |
| MODIFY | `libs/*/project.json` | Add type/scope tags as libs are created |
| MODIFY | `apps/*/project.json` | Add type/scope tags as apps are created |

---

## Checklist

- [ ] Phase 1: ESLint config updated
- [ ] Phase 2: Tag conventions documented
- [ ] Phase 3: Example project.json patterns ready
- [ ] Phase 4: `nx lint` runs without errors
- [ ] Boundary violation produces expected error

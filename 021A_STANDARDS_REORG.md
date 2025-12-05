# 021A_STANDARDS_REORG

**Status: DRAFT**

---

## Overview

Reorganize existing backend-specific standards and templates into dedicated subdirectories. Update all index files and references. Redesign AGENTS.md template for progressive disclosure.

**Parent Plan:** [021_FRONTEND_STANDARDS_INITIATIVE](./021_FRONTEND_STANDARDS_INITIATIVE.md)

**Prerequisites:**
- None (this is the first sub-plan)

**Blockers:**
- None

---

## Goals

1. Move 16 backend standards to `docs/standards/backend/`
2. Move 4 backend templates to `docs/templates/backend/`
3. Update all index files (README.md, CONTENTS.md)
4. Redesign AGENTS.md template for focused agent context
5. Create index sync verification script

---

## Exit Criteria

- [ ] All backend standards in `docs/standards/backend/`
- [ ] All backend templates in `docs/templates/backend/`
- [ ] No broken internal links
- [ ] `tools/verify-docs-index.sh` passes
- [ ] AGENTS.md template uses progressive disclosure format

---

## Phase 1: Create Directory Structure

**Files:**
- CREATE: `docs/standards/backend/README.md`
- CREATE: `docs/standards/frontend/README.md`
- CREATE: `docs/templates/backend/README.md`
- CREATE: `docs/templates/frontend/README.md`

**Implementation:**
Each README.md should be a minimal index pointing to contained files.

---

## Phase 2: Move Backend Standards

**Prereqs:** Phase 1 directories exist

**Files to MOVE:**

| From | To |
|------|----|
| `docs/standards/architecture.md` | `docs/standards/backend/architecture.md` |
| `docs/standards/models.md` | `docs/standards/backend/models.md` |
| `docs/standards/resiliency-circuit-breakers.md` | `docs/standards/backend/resiliency-circuit-breakers.md` |
| `docs/standards/resiliency-retries.md` | `docs/standards/backend/resiliency-retries.md` |
| `docs/standards/resiliency-bulk-heads.md` | `docs/standards/backend/resiliency-bulk-heads.md` |
| `docs/standards/resiliency-timeouts.md` | `docs/standards/backend/resiliency-timeouts.md` |
| `docs/standards/caching.md` | `docs/standards/backend/caching.md` |
| `docs/standards/observability-logs.md` | `docs/standards/backend/observability-logs.md` |
| `docs/standards/observability-metrics.md` | `docs/standards/backend/observability-metrics.md` |
| `docs/standards/observability-traces.md` | `docs/standards/backend/observability-traces.md` |
| `docs/standards/error-handling.md` | `docs/standards/backend/error-handling.md` |
| `docs/standards/security.md` | `docs/standards/backend/security.md` |
| `docs/standards/validation.md` | `docs/standards/backend/validation.md` |
| `docs/standards/testing-unit.md` | `docs/standards/backend/testing-unit.md` |
| `docs/standards/testing-integration.md` | `docs/standards/backend/testing-integration.md` |
| `docs/standards/testing-e2e.md` | `docs/standards/backend/testing-e2e.md` |
| `docs/standards/frontend-guiding-principles.md` | `docs/standards/frontend/guiding-principles.md` |

**Files to KEEP in root (shared):**
- `docs/standards/README.md` (will be updated)
- `docs/standards/CONTENTS.md` (will be updated)
- `docs/standards/documentation.md`
- `docs/standards/code-style.md`

---

## Phase 3: Move Backend Templates

**Prereqs:** Phase 1 directories exist

**Files to MOVE:**

| From | To |
|------|----|
| `docs/templates/_template_controller.md` | `docs/templates/backend/_template_controller.md` |
| `docs/templates/_template_redis_cache.md` | `docs/templates/backend/_template_redis_cache.md` |
| `docs/templates/_template_redis_pubsub.md` | `docs/templates/backend/_template_redis_pubsub.md` |
| `docs/templates/_template_postgres_repository.md` | `docs/templates/backend/_template_postgres_repository.md` |

**Files to KEEP in root (shared):**
- `docs/templates/_template_agents.md` (will be redesigned)
- `docs/templates/_template_readme.md`
- `docs/templates/_template_contents.md`

---

## Phase 4: Update All Index Files

**Prereqs:** Phases 2-3 complete

**Files to MODIFY:**

| File | Update Required |
|------|-----------------|
| `CLAUDE.md` | Update paths in "Standards" and "Templates" sections |
| `CONTENTS.md` (root) | Update docs section to reflect backend/frontend split |
| `docs/standards/README.md` | Restructure: shared at root, link to backend/ and frontend/ |
| `docs/standards/CONTENTS.md` | Update to list backend/*.md and frontend/*.md |
| `docs/standards/backend/README.md` | Index all 16 backend standards |
| `docs/standards/frontend/README.md` | Index (initially just guiding-principles.md) |
| `docs/templates/README.md` | Create if missing; index shared, backend/, frontend/ |
| `.claude/commands/create-implementation-plan.md` | Update standard/template paths |

---

## Phase 5: Redesign AGENTS.md Template

**File:** `docs/templates/_template_agents.md`

**Design Principles:**
- Progressive disclosure: most critical info first
- Minimal context: what an agent needs, nothing more
- Actionable: Do/Don't, not history

**New Format:**
```markdown
# {Package Name}

## Boundaries
Files requiring careful review: {list files with one-line reason}

## Conventions
- {Convention 1 - most important pattern}
- {Convention 2}
- {Convention 3}

## Warnings
- {Critical gotcha that causes bugs}
- {Another warning if applicable}
```

**Rationale:**
- No "Overview" - agents get context from CONTENTS.md and code
- No "Dependencies" - agents can read package.json/build.gradle
- No "Testing" - covered in README.md
- Focus on: what breaks, what's non-obvious

---

## Phase 6: Index Sync Verification Script

**Prereqs:** 020 Phase 1.1 (package.json exists)

**Files:**
- CREATE: `tools/verify-docs-index.sh`
- MODIFY: `package.json` (add script)

**Implementation:**
```bash
#!/usr/bin/env bash
# tools/verify-docs-index.sh
set -euo pipefail

ERRORS=0

check_index() {
  local dir="$1"
  local index_file="$2"

  if [[ ! -f "$index_file" ]]; then
    echo "ERROR: Missing index file: $index_file"
    ((ERRORS++))
    return
  fi

  for md_file in "$dir"/*.md; do
    [[ -f "$md_file" ]] || continue
    local basename=$(basename "$md_file")
    [[ "$basename" == "README.md" || "$basename" == "CONTENTS.md" ]] && continue

    if ! grep -q "$basename" "$index_file"; then
      echo "ERROR: $basename not listed in $index_file"
      ((ERRORS++))
    fi
  done
}

echo "Checking documentation indexes..."
check_index "docs/standards" "docs/standards/README.md"
check_index "docs/standards/backend" "docs/standards/backend/README.md"
check_index "docs/standards/frontend" "docs/standards/frontend/README.md"
check_index "docs/templates/backend" "docs/templates/README.md"
check_index "docs/templates/frontend" "docs/templates/README.md"

if [[ $ERRORS -gt 0 ]]; then
  echo "Found $ERRORS index synchronization errors"
  exit 1
fi
echo "All documentation indexes are in sync"
```

**package.json addition:**
```json
{
  "scripts": {
    "check:docs-index": "bash tools/verify-docs-index.sh"
  }
}
```

---

## Files Summary

| Action | File | Purpose |
|--------|------|---------|
| CREATE | `docs/standards/backend/README.md` | Backend standards index |
| CREATE | `docs/standards/frontend/README.md` | Frontend standards index |
| CREATE | `docs/templates/backend/README.md` | Backend templates index |
| CREATE | `docs/templates/frontend/README.md` | Frontend templates index |
| CREATE | `tools/verify-docs-index.sh` | Index sync verification |
| MOVE | 16 files from `docs/standards/` | → `docs/standards/backend/` |
| MOVE | 1 file (`frontend-guiding-principles.md`) | → `docs/standards/frontend/guiding-principles.md` |
| MOVE | 4 files from `docs/templates/` | → `docs/templates/backend/` |
| MODIFY | `CLAUDE.md` | Update paths |
| MODIFY | `CONTENTS.md` (root) | Update docs section |
| MODIFY | `docs/standards/README.md` | Restructure for split |
| MODIFY | `docs/standards/CONTENTS.md` | Update file listings |
| MODIFY | `docs/templates/README.md` | Index all template dirs |
| MODIFY | `docs/templates/_template_agents.md` | Progressive disclosure redesign |
| MODIFY | `.claude/commands/create-implementation-plan.md` | Update paths |
| MODIFY | `package.json` | Add check:docs-index script |

---

## Checklist

- [ ] Phase 1: Directories created
- [ ] Phase 2: Backend standards moved
- [ ] Phase 3: Backend templates moved
- [ ] Phase 4: All indexes updated
- [ ] Phase 5: AGENTS.md template redesigned
- [ ] Phase 6: Verification script works
- [ ] `pnpm check:docs-index` passes

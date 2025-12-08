# Subagent Coordination Patterns

Patterns for spawning, managing, and coordinating subagents during plan execution.

## Spawning Subagents

### Basic Subagent Spawn

```bash
claude --dangerously-skip-permissions "[task description]"
```

### With Working Directory

```bash
claude --dangerously-skip-permissions -p /path/to/workspace "[task]"
```

### Parallel Execution (Independent Phases)

When phases have no dependencies between them:

```bash
# Terminal 1
claude --dangerously-skip-permissions "Execute Phase 1.1..."

# Terminal 2  
claude --dangerously-skip-permissions "Execute Phase 1.2..."
```

Only parallelize when the plan explicitly indicates phases can run concurrently.

## Subagent Task Scoping

### Good: Tightly Scoped Task

```
Execute Phase 2.1: Extend Product Record

FILES TO MODIFY:
- libs/backend/shared-model/shared-model-product/src/main/java/org/example/model/product/Product.java

IMPLEMENTATION:
[Exact code from plan]

VERIFICATION:
Run: pnpm nx build :libs:backend:shared-model:shared-model-product

REPORT: Files changed, build result, any issues.
```

### Bad: Overly Broad Task

```
Do the backend stuff from plan 043B.
```

## Context Handoff

Each subagent needs:

1. **Plan context** - Which plan and phase
2. **Prerequisites** - What was already done
3. **Exact task** - Specific files and changes
4. **Constraints** - What NOT to touch
5. **Verification** - How to confirm success
6. **Output format** - What to report back

### Template

```
## Context
You are executing: [Plan] > [Sub-Plan] > [Phase] > [Section]
Prerequisites completed: [List with verification status]

## Task
[Paste exact section from plan]

## Constraints  
- ONLY modify these files: [list]
- Do NOT modify: [exclusions]
- Do NOT run these commands: [if any]

## Verification
Before reporting complete, run:
[commands]

## Report Format
1. Files changed:
   - [path]: [1-line description of change]
2. Verification results:
   - [command]: [PASS/FAIL]
3. Checklist items completed:
   - [x] [item]
4. Issues encountered:
   - [description] or "None"
```

## State Management Between Subagents

### Progress File (Orchestrator Maintains)

```markdown
# Plan Execution State

## Current Position
- Plan: 043_MODEL_ALIGNMENT
- Sub-Plan: 043B_SHARED_MODELS  
- Phase: 2
- Section: 2.1 (in progress)

## Completed Work
- 043A: COMPLETE (verified)
  - Phase 0: COMPLETE
  - Phase 1: COMPLETE

## Environment State
- Branch: feat/model-alignment
- Last commit: abc123
- Build status: PASSING
- Test status: PASSING

## Artifacts Created
- e2e/wiremock/mappings/merchandise.json (modified)
- e2e/wiremock/mappings/price.json (modified)

## Decisions Made
- Used BigDecimal for prices (per plan)
- Category comes from merchandise service (no catalog call)
```

### Passing State to Next Subagent

```
Previous phase (2.1) completed:
- Product record extended with 4 new fields
- BigDecimal used for price fields
- inStock() and onSale() methods added
- Build: libs:backend:shared-model:shared-model-product PASSING

Your phase (2.2) should now extend CartProduct using the same pattern.
```

## Error Handling Patterns

### Recoverable Error

Subagent reports:
```
ISSUE: Test failing in ProductServiceTest.java
CAUSE: Test still uses old 4-param constructor
SUGGESTION: Update test fixture to use new 8-param constructor
BLOCKING: No - can continue after fix
```

Orchestrator action:
```
1. Spawn fix subagent for the specific test
2. Re-run verification
3. Continue execution
```

### Blocking Error

Subagent reports:
```
BLOCKER: MerchandiseRepository.getMerchandise() method doesn't exist
EXPECTED: Should have been created in Phase 4.2
CAUSE: Phase 4.2 was skipped or failed
BLOCKING: Yes - cannot proceed
```

Orchestrator action:
```
1. Check progress file - was 4.2 completed?
2. If no: Execute 4.2 first
3. If yes: Investigate why method missing
4. Resume after resolution
```

### Unrecoverable Error

Subagent reports:
```
FATAL: Cannot parse existing Product.java - syntax error
CAUSE: File corrupted or concurrent modification
BLOCKING: Yes - manual intervention needed
```

Orchestrator action:
```
1. Stop execution
2. Report to user with full context
3. Suggest: git stash / git checkout to restore
4. Wait for user resolution
```

## Verification Patterns

### Quick Verification (After Each Section)

```bash
# Just compile
pnpm nx build [affected-project]
```

### Phase Verification (After Each Phase)

```bash
# Compile all affected
pnpm nx run-many -t build --projects=[list]

# Run unit tests
pnpm nx run-many -t test --projects=[list]
```

### Sub-Plan Verification (After Each Sub-Plan)

```bash
# Full build
pnpm nx run-many -t build

# Full test suite
pnpm nx run-many -t test

# E2E if applicable
pnpm nx e2e [e2e-project]
```

### Plan Verification (Final)

```bash
# Everything
pnpm nx run-many -t build
pnpm nx run-many -t test
pnpm nx run-many -t e2e

# Manual verification points from plan
curl http://localhost:8080/products/12345 | jq .
```

## Rollback Patterns

### Phase Rollback

```bash
# Undo uncommitted changes in specific files
git checkout -- [files from phase]
```

### Sub-Plan Rollback

```bash
# Reset to commit before sub-plan started
git reset --hard [commit-before-subplan]
```

### Full Plan Rollback

```bash
# Reset to commit before plan started
git reset --hard [commit-before-plan]

# Or if pushed, revert
git revert --no-commit [plan-commits]
git commit -m "revert: rollback plan [name]"
```

## Coordination Anti-Patterns

### ❌ Fire and Forget

```
# Bad - no verification, no progress tracking
claude "do phase 1"
claude "do phase 2"
claude "do phase 3"
```

### ❌ Monolithic Delegation

```
# Bad - too much scope for one subagent
claude "implement the entire 043B sub-plan"
```

### ❌ Missing Context

```
# Bad - subagent doesn't know prerequisites
claude "extend the CartProduct record"
```

### ✅ Good Pattern

```
# Verify prerequisites
pnpm nx build :libs:backend:shared-model:shared-model-product  # Confirm 2.1 done

# Spawn with full context
claude --dangerously-skip-permissions "
Context: Plan 043B, Phase 2, Section 2.2
Prereq: Product record extended (verified)
Task: [paste exact section]
Verify: [commands]
Report: [format]
"

# Check result
[review subagent output]
[run verification]
[update progress file]
[commit if successful]
```
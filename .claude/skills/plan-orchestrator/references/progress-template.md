# Progress Tracking Template

Use this template to track plan execution state.

## Template: `.plan-progress/[plan-name].md`

```markdown
# Progress: [PLAN_NUMBER]_[PLAN_NAME]

**Started:** [ISO timestamp]
**Status:** NOT_STARTED | IN_PROGRESS | BLOCKED | COMPLETE | ROLLED_BACK
**Branch:** [git branch name]
**Initial Commit:** [commit hash before plan started]

---

## Execution Summary

| Sub-Plan | Status | Started | Completed | Notes |
|----------|--------|---------|-----------|-------|
| [A] | ⬜ NOT_STARTED | - | - | - |
| [B] | 🔄 IN_PROGRESS | [time] | - | Phase 2 active |
| [C] | ⏸️ BLOCKED | - | - | Waiting on B |
| [D] | ⏸️ BLOCKED | - | - | Waiting on C |

---

## [SUB_PLAN_A]: [Name]

**Status:** ✅ COMPLETE
**Started:** [timestamp]
**Completed:** [timestamp]
**Commit:** [hash] - [message]

### Phase 0: [Name]
- [x] 0.1 [Task] (completed [time])
- [x] 0.2 [Task] (completed [time])

**Verification:** ✅ PASSED
```
[command output summary]
```

### Phase 1: [Name]
- [x] 1.1 [Task]
- [x] 1.2 [Task]

**Verification:** ✅ PASSED

---

## [SUB_PLAN_B]: [Name]

**Status:** 🔄 IN_PROGRESS
**Started:** [timestamp]

### Phase 2: [Name]
- [x] 2.1 [Task] (completed [time])
- [ ] 2.2 [Task] ← CURRENT

### Phase 3: [Name]
- [ ] 3.1 [Task]

---

## Blockers

| ID | Description | Blocking | Status | Resolution |
|----|-------------|----------|--------|------------|
| B1 | [description] | Phase 2.2 | RESOLVED | [how resolved] |

---

## Decisions & Deviations

| Decision | Rationale | Impact |
|----------|-----------|--------|
| Used X instead of Y | [why] | [what changed] |

---

## Git History

| Commit | Sub-Plan | Phase | Message |
|--------|----------|-------|---------|
| abc123 | 043A | 0-1 | feat: complete config and stubs |
| def456 | 043B | 2.1 | feat: extend Product record |

---

## Verification Log

### [timestamp] - Sub-Plan A Complete
```
$ pnpm nx run-many -t build
✓ All builds passed

$ pnpm nx run-many -t test  
✓ 142 tests passed
```

---

## Rollback Points

| Point | Commit | Restores To |
|-------|--------|-------------|
| Before plan | [hash] | Clean state |
| After 043A | [hash] | Config + stubs done |
| After 043B | [hash] | Models extended |
```

## Status Icons

| Icon | Meaning |
|------|---------|
| ⬜ | Not started |
| 🔄 | In progress |
| ⏸️ | Blocked/Waiting |
| ✅ | Complete |
| ❌ | Failed |
| ⚠️ | Complete with issues |

## Updating Progress

### After Each Section

```markdown
- [x] 2.1 [Task] (completed 14:32)
```

### After Each Phase

```markdown
### Phase 2: [Name]
- [x] 2.1 ...
- [x] 2.2 ...

**Verification:** ✅ PASSED
```

### After Each Sub-Plan

```markdown
## [SUB_PLAN_B]: [Name]

**Status:** ✅ COMPLETE
**Completed:** [timestamp]
**Commit:** [hash]
```

Also update the summary table at the top.

### On Blocker

```markdown
## Blockers

| ID | Description | Blocking | Status | Resolution |
|----|-------------|----------|--------|------------|
| B2 | Test fixture uses old constructor | Phase 2.2 | ACTIVE | - |
```

### On Resolution

Update blocker status and add to Decisions if deviation was needed:

```markdown
| B2 | Test fixture uses old constructor | Phase 2.2 | RESOLVED | Updated fixture |
```

## File Location

Store progress files in `.plan-progress/` directory:

```
.plan-progress/
├── 043_MODEL_ALIGNMENT.md
├── 044_SELF_CHECKOUT_KIOSK.md
└── 045_POS_SYSTEM.md
```

This directory should be gitignored (execution state, not source).
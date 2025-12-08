# Plan Format Reference

This document specifies the expected structure of implementation plans.

## Parent Plan Structure

```markdown
# [NUMBER]_[NAME]

**Status:** DRAFT | IN_PROGRESS | COMPLETE

---

## Overview
[Description of what this plan accomplishes]

**Prerequisite for:** [Other plans that depend on this]
**Motivation:** [Why this work is needed]

---

## Sub-Plans

Execute in order:

| Sub-Plan | Phases | Description |
|----------|--------|-------------|
| `[NUMBER]A_[NAME].md` | 0-1 | [Brief description] |
| `[NUMBER]B_[NAME].md` | 2-3 | [Brief description] |

### Execution Order

[ASCII diagram showing dependencies]

---

## Goals
1. [Specific goal]
2. [Specific goal]

## Non-Goals
- [Explicit exclusion]

---

## Type Decisions (if applicable)
| Field | Type | Notes |
|-------|------|-------|

---

## Breaking Changes
1. [Breaking change description]

**Rollback:** [How to revert]

---

## Verification
```bash
[Commands to verify completion]
```

---

## Checklist
- [ ] [Sub-plan A] complete
- [ ] [Sub-plan B] complete
- [ ] All builds pass
- [ ] All tests pass
```

## Sub-Plan Structure

```markdown
# [NUMBER][LETTER]_[NAME]

**Status:** DRAFT | IN_PROGRESS | COMPLETE

---

## Overview
[What this sub-plan accomplishes]

**Parent Plan:** `[NUMBER]_[NAME].md`
**Prereqs:** `[Previous sub-plan]` (must complete first)
**Next:** `[Next sub-plan]`

---

## Goals
1. [Specific goal for this sub-plan]

---

## Phase [N]: [Phase Name]

**Prereqs:** [What must be done before this phase]
**Blockers:** None | [List of blockers]

### [N.1] [Section Name]

**Files:**
- CREATE: `path/to/new/file.ts`
- MODIFY: `path/to/existing/file.ts`
- VERIFY: `path/to/check/file.ts`
- DELETE: `path/to/remove/file.ts`

**Implementation:**
```[language]
[Code example or pseudocode]
```

**Notes:**
- [Implementation notes]

### [N.2] [Next Section]
[...]

---

## Files Summary

| Action | File | Purpose |
|--------|------|---------|
| CREATE | `path/file` | [Why] |
| MODIFY | `path/file` | [Why] |

---

## Verification

```bash
[Commands to verify this sub-plan]
```

---

## Rollback Strategy
[How to revert if issues arise]

---

## Checklist

### Phase [N]: [Name]
- [ ] [Task 1]
- [ ] [Task 2]

### Phase [N+1]: [Name]
- [ ] [Task 1]

### Final Verification
- [ ] Build succeeds
- [ ] Tests pass
```

## Key Parsing Points

When parsing plans, extract:

1. **Dependencies**
   - `Prereqs:` field in sub-plans
   - `Blockers:` field in phases
   - `Prerequisite for:` in parent plans

2. **Execution Order**
   - Sub-plan table order
   - Phase numbers (0, 1, 2...)
   - Section numbers (0.1, 1.1, 1.2...)

3. **File Operations**
   - CREATE = new file
   - MODIFY = change existing
   - VERIFY = check without changing
   - DELETE = remove file

4. **Progress Tracking**
   - Checklist items (`- [ ]` and `- [x]`)
   - Phase completion status
   - Verification command results

5. **Risk Assessment**
   - Breaking changes section
   - Rollback strategy
   - Blockers list

## Dependency Resolution

Build execution order by:

1. Parse all sub-plan `Prereqs` fields
2. Create directed graph of dependencies
3. Topological sort for execution order
4. Verify no cycles exist

Example:
```
043A (no prereqs) → 043B (prereqs: 043A) → 043C (prereqs: 043B) → 043D (prereqs: 043C)
```

## Status Transitions

```
DRAFT → IN_PROGRESS → COMPLETE
                   ↘ BLOCKED (if blocker found)
                   ↘ FAILED (if verification fails)
```
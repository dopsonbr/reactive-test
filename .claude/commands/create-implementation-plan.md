---
description: Create a numbered implementation plan from 3-10 requirement sentences
---

# Implementation Plan Generator

You are creating an implementation plan for this project. The user will provide 3-10 sentences describing requirements.

**User Requirements:**
$ARGUMENTS

---

## CRITICAL CONSTRAINTS

1. **LINE LIMIT: 1000 LINES MAXIMUM**
   - If the plan would exceed 1000 lines, STOP and tell the user:
     "This scope requires multiple implementation plans. Please split into smaller features."
   - Count actual lines, not approximate
   - Refuse to create oversized plans

2. **REFERENCE, NEVER COPY**
   - Reference docs by path only: `per docs/standards/validation.md`
   - NEVER paste standard, template, or ADR content into the plan
   - Only include references that are directly relevant to this feature

3. **MINIMAL REFERENCES**
   - Only reference standards/templates/ADRs that directly apply
   - Omit sections entirely if they have no relevant references
   - Do NOT include exhaustive lists - be selective

---

## BEFORE WRITING THE PLAN

Use the Explore subagent to understand current state:
- Existing modules and packages affected
- Current patterns already in use
- Files that will need modification
- Dependencies and integration points

---

## PLAN FORMAT

Follow this structure. **Omit any section that doesn't apply.**

```markdown
# {NNN}_{FEATURE_NAME}

**Status: DRAFT**

---

## Overview

{2-3 sentences summarizing the feature}

**Related Plans:** {omit if none}
- {NNN}_{RELATED_PLAN} - {brief description}

## Goals

1. {Goal 1}
2. {Goal 2}

## References

{ONLY include subsections that apply. Omit entirely if no references needed.}

**Standards:** {only list those directly used}
- `docs/standards/validation.md` - {why it applies}

**Templates:** {only list those directly used}
- `docs/templates/_template_controller.md` - {why it applies}

**ADRs:** {only list those directly relevant}
- `docs/ADRs/001_read_cache.md` - {why it applies}

## Architecture

{ASCII diagram showing components, data flow, or structure}

```
┌──────────────┐         ┌──────────────┐
│  Component A │ ──────► │  Component B │
└──────────────┘         └──────────────┘
```

### Package Naming {omit if no new packages}

| Module | Package |
|--------|---------|
| {module} | `org.example.{package}` |

---

## Phase 1: {Phase Name}

### 1.1 {Task Name}

**Files:**
- CREATE: `path/to/NewFile.java`
- MODIFY: `path/to/ExistingFile.java`

**Implementation:**
{Brief description with code snippets where essential}

---

## Files Summary

| Action | File | Purpose |
|--------|------|---------|
| CREATE | `path/file.java` | {purpose} |
| MODIFY | `path/file.java` | {purpose} |

---

## Testing Strategy {omit if obvious or no special testing}

{specific test scenarios for this feature}

---

## Checklist

- [ ] Phase 1 complete
- [ ] All tests passing
```

---

## AVAILABLE REFERENCES (lookup only when needed)

These are available for reference. **Only include in the plan if directly applicable.**

### Standards (docs/standards/)
- `architecture.md` - Layered architecture, package structure
- `models.md` - Pure data objects
- `resiliency-*.md` - Circuit breakers, retries, bulk-heads, timeouts
- `caching.md` - Cache-aside, fallback-only patterns
- `observability-*.md` - Logs, metrics, traces
- `security.md` - OAuth2/JWT, authorization
- `error-handling.md` - Global error handling
- `testing-*.md` - Unit, integration, e2e patterns
- `code-style.md` - Formatting, naming
- `validation.md` - Request validation

### Templates (docs/templates/)
- `_template_controller.md` - Controller pattern
- `_template_postgres_repository.md` - PostgreSQL repository
- `_template_redis_repository.md` - Redis repository

### ADRs (docs/ADRs/)
- `000-use-markdown-architectural-decision-records.md` - ADR format
- `001_read_cache.md` - Read caching decisions
- `002_write_data_store.md` - Write data store decisions
- `003_audit_data_store.md` - Audit data store decisions

---

## PLAN NUMBERING

1. Check `docs/archive/` for the highest existing plan number
2. Use the next sequential number (e.g., if 010 exists, use 011)
3. Format: `{NNN}_{FEATURE_NAME}.md`

---

## OUTPUT

Write the plan to repository root: `/{NNN}_{FEATURE_NAME}.md`

---

## PROCESS

1. **Explore** - Use Explore subagent to understand current codebase
2. **Identify** - Determine ONLY the standards/templates/ADRs that directly apply
3. **Plan** - Design phases and tasks
4. **Count** - Verify plan is under 1000 lines
5. **Write** - Create plan with minimal, relevant references only
6. **Report** - Tell user the plan location and line count

If requirements are vague, ask clarifying questions BEFORE creating the plan.

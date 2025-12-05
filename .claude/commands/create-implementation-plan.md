---
description: Create a numbered implementation plan from 3-10 requirement sentences
---

# Implementation Plan Generator

You are creating an implementation plan for this project. The user will provide 3-10 sentences describing requirements.

**User Requirements:**
$ARGUMENTS

---

## CRITICAL CONSTRAINTS

1. **LINE LIMIT: HARD CAP 1000, TARGET ≤ 500**
   - If the plan would exceed 1000 lines, STOP and tell the user:
     "This scope requires multiple implementation plans. Please split into smaller features."
   - Aim for 300-500 lines; shorter is better if it remains clear
   - Break large scopes into multiple numbered plans rather than stretching one doc
   - Count actual lines, not approximate

2. **REFERENCE, NEVER COPY**
   - Reference docs by path only: `per docs/standards/validation.md`
   - NEVER paste standard, template, or ADR content into the plan
   - Only include references that are directly relevant to this feature

3. **MINIMAL REFERENCES**
   - Only reference standards/templates/ADRs that directly apply
   - Omit sections entirely if they have no relevant references
   - Do NOT include exhaustive lists - be selective

4. **LLM-FRIENDLY PLANS**
   - Make each phase action-oriented with explicit file paths and outcomes
   - Prefer concise “Files” + “Implementation” bullets over long prose
   - Call out prerequisites/unknowns clearly (what to spike, what to clarify)
   - Avoid large code blocks; include only essential snippets

---

## BEFORE WRITING THE PLAN

Use the Explore subagent to understand current state:
- Existing modules and packages affected
- Current patterns already in use
- Files that will need modification
- Dependencies and integration points
- Documentation files that may need updates (CLAUDE.md, README files, AGENTS.md)

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

### Package/Project Naming {omit if no new packages}

| Module/Project | Package/Import |
|----------------|----------------|
| Backend module | `org.example.{package}` |
| Nx lib (web)   | `@reactive-platform/{scope}-{type}` (e.g., `@reactive-platform/shared-ui`) |
| Nx app (web)   | `apps/{app-name}` with tags `type:app`, `scope:{domain}`, `platform:web` |

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

## Documentation Updates

{List all documentation files that need updating. Consider:}

| File | Update Required |
|------|-----------------|
| `CLAUDE.md` | {Add new module/service to project structure, commands, etc.} |
| `README.md` | {Update if user-facing features change} |
| `{module}/README.md` | {Module-specific documentation} |
| `{module}/AGENTS.md` | {AI agent guidance for new packages} |
| `docs/standards/*.md` | {New or updated standards} |
| `docs/templates/*.md` | {New reusable patterns} |
| `docs/ADRs/*.md` | {Architectural decisions made} |

{Omit this section if no documentation updates needed}

---

## Checklist

- [ ] Phase 1 complete
- [ ] All tests passing
- [ ] Documentation updated
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

### Sub-plan Strategy (branch-friendly)

- For large initiatives, create a parent number with child letters to isolate branches:
  - Example: `030A_frontend-standards.md`, `030B_frontend-templates.md`, `030C_frontend-linting.md`
  - Each sub-plan should stand alone and be mergeable independently
  - The parent overview lives in `030_frontend-initiative.md` and links to the sub-plans
  - Keep each sub-plan ≤ 500 lines; if a sub-plan would exceed that, split again
  - Reference each sibling plan in **Related Plans** to show dependencies/order

### Line Counting and Split Rules

- Before finalizing, run `wc -l {plan-file}.md` to confirm line count.
- Split when: you exceed 500 lines, you have more than ~4 phases, or distinct workstreams can be branched independently.

---

## OUTPUT

Write the plan to repository root: `/{NNN}_{FEATURE_NAME}.md`

---

## PROCESS

1. **Explore** - Use Explore subagent to understand current codebase
2. **Identify** - Determine ONLY the standards/templates/ADRs that directly apply
3. **Plan** - Design phases and tasks
4. **Documentation** - Identify all docs needing updates (CLAUDE.md, READMEs, AGENTS.md, standards)
5. **Count** - Verify plan is under 1000 lines
6. **Write** - Create plan with minimal, relevant references only
7. **Report** - Tell user the plan location and line count

If requirements are vague, ask clarifying questions BEFORE creating the plan.

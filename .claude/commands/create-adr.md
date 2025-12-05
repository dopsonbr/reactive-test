---
description: Create an Architectural Decision Record (ADR) using MADR 4.0.0 format
---

# ADR Generator

Create an Architectural Decision Record for this project. The user will describe a decision that needs to be documented.

**Decision Topic:**
$ARGUMENTS

---

## FORMAT: MADR 4.0.0

This project uses [MADR 4.0.0](https://adr.github.io/madr/) per `docs/ADRs/000-use-markdown-architectural-decision-records.md`.

---

## BEFORE WRITING

1. **Explore the codebase** - Use Explore subagent to understand:
   - Current implementation relevant to this decision
   - Existing patterns and conventions
   - Files/modules affected by this decision
   - Related ADRs that might be superseded or linked

2. **Identify the next ADR number** - Check `docs/ADRs/` for highest number, use next

---

## ADR TEMPLATE

```markdown
# {Title - Short Noun Phrase}

* Status: {proposed | accepted | deprecated | superseded by [ADR-XXX](XXX_name.md)}
* Deciders: {team names or roles}
* Date: {YYYY-MM-DD}

## Context and Problem Statement

{Describe the context and problem in 2-5 sentences. What forces are at play? What decision needs to be made?}

## Decision Drivers

{List 3-6 key factors influencing this decision}

1. {Driver 1}
2. {Driver 2}
3. {Driver 3}

## Considered Options

{List 2-4 options considered}

1. {Option 1} (chosen)
2. {Option 2}
3. {Option 3}

## Decision Outcome

Chosen option: **{Option name}**

{1-2 paragraph explanation of why this option was chosen and how it addresses the drivers}

### Positive Consequences

- {Benefit 1}
- {Benefit 2}

### Negative Consequences

- {Drawback 1}
- {Drawback 2}

## Pros and Cons of the Options

### 1. {Option 1} (chosen)

**Good**
- {Pro 1}
- {Pro 2}

**Bad**
- {Con 1}
- {Con 2}

### 2. {Option 2}

**Good**
- {Pro 1}

**Bad**
- {Con 1}

{Repeat for each option}

## Implementation Notes and Next Steps

- {Concrete next step 1}
- {Concrete next step 2}

## References

- {Link to relevant code: `path/to/file.java:line`}
- {Link to related ADR or implementation plan}
- {External documentation if applicable}
```

---

## GUIDELINES

**Title:** Use a short noun phrase describing what is being decided
- Good: "Choose Postgres as Cart Write Store"
- Bad: "Database Decision" or "We should use Postgres"

**Context:** Ground in actual codebase state with file references
- Reference specific files: `apps/product-service/src/.../Repository.java:37`
- Link to implementation plans if relevant

**Options:** Always include at least 2-3 realistic alternatives
- Include "status quo" if applicable
- Each option should be genuinely viable

**Consequences:** Be honest about tradeoffs
- Every decision has negative consequences
- Don't oversell the chosen option

**References:** Link to actual code locations affected
- Use `path/to/file.java:line` format for code
- Link related ADRs or implementation plans

---

## NUMBERING

1. List existing ADRs: `docs/ADRs/`
2. Find highest number (e.g., `003_audit_data_store.md` → 003)
3. Use next number with underscore format: `004_topic_name.md`

---

## OUTPUT

Write the ADR to: `docs/ADRs/{NNN}_{snake_case_topic}.md`

---

## PROCESS

1. **Explore** - Understand current codebase context
2. **Number** - Determine next ADR number
3. **Draft** - Write ADR following MADR 4.0.0 template
4. **Reference** - Include specific file paths and line numbers
5. **Write** - Save to docs/ADRs/
6. **Report** - Tell user the ADR location

If the decision topic is unclear, ask clarifying questions BEFORE writing.

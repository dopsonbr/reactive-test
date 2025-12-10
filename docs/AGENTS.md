# Documentation Site: Agent Guidance

## Purpose

Help AI agents navigate this documentation site efficiently.

## Quick Navigation

| Need | Location |
|------|----------|
| Current work | `/plans/active/` |
| Historical decisions | `/ADRs/` |
| Coding patterns | `/standards/backend/`, `/standards/frontend/` |
| Code templates | `/templates/` |
| Actual repo structure | `/repo-explorer/` |

## File Discovery Strategy

1. **For implementation tasks** - Check `/plans/active/` first
2. **For "how should I..." questions** - Check `/standards/`
3. **For "why was this..." questions** - Check `/ADRs/`
4. **For "where is..." questions** - Check `/repo-explorer/`

## Key Conventions

- Plans use `NNN_FEATURE_NAME.md` numbering (preserved from git history)
- Standards follow Intent → Outcomes → Patterns → Anti-patterns structure
- ADRs use MADR 4.0.0 format

## Do Not

- Cite standards verbatim in plans—reference by path
- Create new files in `/repo-explorer/`—it's auto-generated
- Edit files in `/plans/completed/`—they are historical records

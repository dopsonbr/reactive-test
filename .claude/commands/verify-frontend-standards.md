---
description: Verify a frontend app or library meets documented standards (components, state management, testing, etc.)
---

Use the frontend-standards-verifier subagent to audit the specified frontend app or library for standards compliance.

**Target:** $ARGUMENTS

If no target specified, ask which app/library to verify from:
- apps/ecommerce-web
- libs/shared-ui/ui-components
- libs/shared-data/api-client

## Standards to verify:
- Architecture & code organization (architecture.md, code-organization.md)
- Component patterns (components.md)
- State management (state-management.md)
- Error handling (error-handling.md)
- Testing coverage (testing.md)
- Observability (observability.md)
- Nx conventions (tags, imports)
- TypeScript strictness

Output a detailed compliance report with:
1. Summary (pass/fail/warn counts)
2. All violations with file paths and fixes
3. Passed checks
4. Recommendations

After the report, ask if I want to create tasks to fix any violations found.

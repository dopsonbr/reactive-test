---
description: Verify a backend service meets documented standards (package structure, validation, resilience, etc.)
---

Use the backend-standards-verifier subagent to audit the specified backend service for standards compliance.

**Target:** $ARGUMENTS

If no target specified, ask which service to verify from:
- apps/product-service
- apps/cart-service
- apps/customer-service
- apps/discount-service
- apps/fulfillment-service
- apps/audit-service

## Standards to verify:
- Package structure (architecture.md)
- Validation layer (validation.md)
- Resilience patterns (resiliency-*.md)
- Domain models (models.md)
- Error handling (error-handling.md)
- Observability (observability-logs.md)

Output a detailed compliance report with:
1. Summary (pass/fail/warn counts)
2. All violations with file paths and fixes
3. Passed checks
4. Recommendations

After the report, ask if I want to create tasks to fix any violations found.

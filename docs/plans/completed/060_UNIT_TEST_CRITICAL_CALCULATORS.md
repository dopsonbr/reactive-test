# 060 Unit Test Critical Calculator Functions

## Status: Complete

## Summary

Added unit tests for critical pure calculator functions in pos-web and pos-ui. These tests cover financial calculations, permission logic, and formatting functions that have high business impact but are straightforward to test.

## Scope

**In Scope:** Pure calculator functions with financial/security impact

| Project | File | Functions | Tests |
|---------|------|-----------|-------|
| pos-web | `transactionReducer.ts` | `calculateLineTotal`, `calculateTotals`, `calculatePayments`, `calculatePoints` | 18 |
| pos-web | `roles.ts` | `hasPermission`, `getMarkdownTier` | 24 |
| pos-web | `markdownCalculations.ts` (new) | `isWithinLimit`, `calculateDiscount`, `getMaxDiscount`, `getLimitsForTier` | 22 |
| pos-ui | `formatting.ts` (new) | `formatCurrency`, `formatMarkdown`, `calculateLineItemTotal` | 16 |

**Total: 80 test cases**

**Out of Scope:**
- React component rendering tests
- Hook state management tests
- API calls / async behavior
- Full reducer action handler tests

## Changes Made

### pos-web

1. **Exported calculator functions** from `transactionReducer.ts`
   - `calculateLineTotal` - line item total with discount
   - `calculateTotals` - subtotal, tax, fulfillment, grand total
   - `calculatePayments` - amount paid, amount due
   - `calculatePoints` - loyalty points calculation

2. **Created test file** `transactionReducer.test.ts` (18 tests)

3. **Created test file** `roles.test.ts` (24 tests)
   - Tests for `hasPermission` across all roles
   - Tests for `getMarkdownTier`
   - Consistency checks for ROLE_PERMISSIONS

4. **Created utils module** `markdown/utils/markdownCalculations.ts`
   - Extracted pure calculation logic from `useMarkdownValidation` hook
   - Functions: `isWithinLimit`, `calculateDiscount`, `getMaxDiscount`, `getLimitsForTier`

5. **Created test file** `markdownCalculations.test.ts` (22 tests)

### pos-ui

1. **Created utils module** `utils/formatting.ts`
   - Extracted from `LineItemRow.tsx`
   - Functions: `formatCurrency`, `formatMarkdown`, `calculateLineItemTotal`

2. **Updated `LineItemRow.tsx`** to import from utils

3. **Exported utils** from main `index.ts`

4. **Created test file** `formatting.test.ts` (16 tests)

## Test Coverage

### Transaction Calculator Tests
- Line total with/without discounts
- Quantity handling
- Subtotal, tax (8%), fulfillment calculations
- Payment split scenarios
- Loyalty points with tier multipliers

### Permission Tests
- Role-based permission checks (ASSOCIATE through ADMIN)
- Markdown tier mapping
- B2B and Contact Center role downgrades

### Markdown Calculation Tests
- Tier limit enforcement (percentage, fixed amount, override price)
- Discount calculation methods
- Max discount retrieval

### Formatting Tests
- USD currency formatting
- Markdown display formatting
- Decimal precision and rounding

## Running Tests

```bash
# Run pos-web tests
pnpm nx test pos-web -- --run

# Run pos-ui tests
pnpm nx test pos-ui -- --run

# Run all affected tests
pnpm nx affected -t test
```

## Future Considerations

For kiosk-web unit tests, consider extracting:
- Timeout calculation logic from `useInactivityTimeout`
- Session state transition logic from `KioskSessionProvider`

These would require refactoring to extract pure functions first.

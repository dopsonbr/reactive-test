# 054 - E2E Fullstack Test Fixes

## Overview

Fix the 4 skipped fullstack E2E tests that are failing due to real integration issues.

## Current Status

| Suite | Passed | Skipped | Issue |
|-------|--------|---------|-------|
| pos-fullstack | 10 | 2 | Frontend API mismatch |
| kiosk-fullstack | 2 | 2 | Cart API + session state |

## Issues to Fix

### Issue 1: POS Frontend Checkout API Mismatch (2 tests)

**Tests:**
- `complete transaction from login to receipt (real services)`
- `can start new transaction after completing one`

**Problem:** POS frontend calls `/api/orders` POST to complete transactions, but the real backend uses `POST /checkout/complete`.

**Root Cause:** Frontend was built against MSW mocks with a different API shape than the real checkout-service.

**Fix Options:**

| Option | Effort | Risk |
|--------|--------|------|
| A. Update frontend to call `/checkout/complete` | Medium | Low - aligns with backend |
| B. Add nginx proxy rewrite `/api/orders` -> `/checkout/complete` | Low | Medium - hides mismatch |

**Recommended:** Option A - Update frontend API client

**Files to Modify:**
- `apps/pos-web/src/api/` or similar - find where orders POST is called
- May need to update request/response types

---

### Issue 2: Kiosk Cart Quantity Update (1 test)

**Test:** `can modify cart quantities before checkout`

**Problem:** Clicking "Increase quantity" button doesn't update the cart. After 10 seconds, quantity still shows "1".

**Possible Causes:**
1. Frontend optimistic update not triggering API call
2. Cart service `PATCH /carts/{id}/items/{sku}` endpoint not working
3. Request headers missing (x-store-number, etc.)
4. Cart ID not being passed correctly

**Investigation Steps:**
1. Check network tab for API call when clicking increase
2. Verify cart-service endpoint exists and works via curl
3. Check if frontend is sending correct headers

**Files to Investigate:**
- `apps/kiosk-web/src/` - cart update logic
- `apps/cart-service/` - quantity update endpoint

---

### Issue 3: Kiosk Session State Cleanup (1 test)

**Test:** `can cancel session and return to welcome`

**Problem:** After canceling a session, the app doesn't properly return to welcome screen.

**Possible Causes:**
1. Session state not being cleared in frontend
2. Navigation not triggered after cancel
3. Backend session cleanup not happening

**Investigation Steps:**
1. Manually test cancel flow in browser
2. Check if localStorage/sessionStorage is cleared
3. Verify cancel button triggers correct actions

**Files to Investigate:**
- `apps/kiosk-web/src/` - session management, cancel handler

---

## Implementation Plan

### Phase 1: Investigation (1-2 hours)

1. **POS Checkout API:**
   - Find where frontend calls `/api/orders`
   - Compare with checkout-service API spec
   - Document exact request/response differences

2. **Kiosk Cart Update:**
   - Open kiosk in browser, add item, try to increase quantity
   - Check browser network tab for API calls
   - Test cart-service endpoint directly with curl

3. **Kiosk Session Cancel:**
   - Test cancel flow manually
   - Check console for errors
   - Verify session state management

### Phase 2: Fix Implementation (2-4 hours)

1. **POS Checkout:** Update frontend to use correct API
2. **Kiosk Cart:** Fix quantity update API integration
3. **Kiosk Session:** Fix state cleanup on cancel

### Phase 3: Enable Tests (30 min)

1. Remove `test.skip` from fixed tests
2. Run full test suite to verify
3. Commit changes

---

## Quick Wins

If full fixes take too long, these are acceptable interim solutions:

1. **POS Checkout:** Add vite proxy rule to rewrite `/api/orders` -> `/checkout/complete`
2. **Kiosk Cart:** Document as known limitation if backend API is the issue
3. **Kiosk Session:** Clear storage manually in test teardown as workaround

---

## Success Criteria

- [ ] All 4 skipped tests pass
- [ ] No regressions in existing passing tests
- [ ] pos-fullstack: 12 passed, 0 skipped
- [ ] kiosk-fullstack: 4 passed, 0 skipped

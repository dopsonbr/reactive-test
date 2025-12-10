# Phase 4 Decision: ecommerce-web Integration

**Date**: 2025-12-09
**Status**: ARCHITECTURAL DECISION

## Context

Phase 4 of 044A_SHARED_COMMERCE_COMPONENTS planned to update ecommerce-web to consume the new shared libraries (`@reactive-platform/commerce-ui` and `@reactive-platform/commerce-hooks`). However, a fundamental architectural incompatibility was discovered during execution.

## Problem

### Cart Operations: GraphQL vs REST Incompatibility

**ecommerce-web (current state)**:
- Uses **GraphQL** with SSE subscriptions for cart operations
- Implemented in plan 046_CART_GRAPHQL_CLIENT_ALIGNMENT (completed AFTER 044A was written)
- File: `apps/ecommerce-web/src/features/cart/api/useCart.ts`
- API calls: `graphqlRequest()` with mutations/queries
- Features: Real-time cart updates via SSE subscriptions

**commerce-hooks library**:
- Uses **REST API** for cart operations
- File: `libs/frontend/shared-data/commerce-hooks/src/hooks/useCart.ts`
- API calls: `apiClient.get()`, `apiClient.post()`, etc.
- No subscription support

### Product Operations: Proxy vs Direct URL Patterns

**ecommerce-web (current state)**:
- Uses proxy-based API client from `@reactive-platform/api-client`
- Paths: `/products/search`, `/products/${sku}`
- Example: `apiClient<Product>('/products/${sku}')`

**commerce-hooks library**:
- Uses direct URLs with environment variable base paths
- Paths: `${API_BASE}/api/products?...`, `${API_BASE}/api/products/${sku}`
- Requires `VITE_PRODUCT_SERVICE_URL` environment variable

## Decision

**DO NOT migrate ecommerce-web to use shared commerce libraries at this time.**

### Rationale

1. **Breaking Changes**: Migrating would break existing GraphQL cart functionality, violating the constraint "Do NOT break existing functionality"

2. **Timeline Mismatch**: Plan 044A was created before plan 046 (GraphQL migration). The shared libraries were designed for REST APIs, but ecommerce-web has since evolved to use GraphQL.

3. **Different Use Cases**:
   - **ecommerce-web**: Full-featured e-commerce with real-time updates, user sessions, complex state
   - **self-checkout-kiosk**: Simpler, REST-based, kiosk-specific workflows

4. **Architectural Divergence**: The apps have legitimately diverged in their architectural patterns:
   - Cart: GraphQL (ecommerce-web) vs REST (kiosk)
   - Products: Proxy-based (ecommerce-web) vs direct URLs (kiosk)
   - State: SessionStorage + subscriptions (ecommerce-web) vs context-based (kiosk)

## Implementation

### What Was Done

1. ✅ Created shared libraries (`commerce-ui`, `commerce-hooks`) for kiosk app
2. ✅ Left ecommerce-web implementations unchanged
3. ✅ Documented this architectural decision

### What Was NOT Done

1. ❌ Did not modify `apps/ecommerce-web/src/features/products/api/useProducts.ts`
2. ❌ Did not modify `apps/ecommerce-web/src/features/cart/api/useCart.ts`
3. ❌ Did not replace ProductCard or CartItemRow in ecommerce-web
4. ❌ Did not create wrapper functions in ecommerce-web

## Files Analysis

| File | Type | Current State | Action Taken |
|------|------|--------------|--------------|
| `apps/ecommerce-web/src/features/cart/api/useCart.ts` | GraphQL | 300 lines, full GraphQL implementation | **KEEP AS-IS** |
| `apps/ecommerce-web/src/features/products/api/useProducts.ts` | Proxy API | Simple REST via proxy | **KEEP AS-IS** |
| `apps/ecommerce-web/src/features/products/components/ProductCard.tsx` | Component | Uses TanStack Router `Link` | **KEEP AS-IS** |
| `apps/ecommerce-web/src/features/cart/components/CartItemRow.tsx` | Component | App-specific styling | **KEEP AS-IS** |
| `apps/ecommerce-web/src/features/cart/api/useCartSubscription.ts` | SSE | Real-time cart updates | **KEEP AS-IS** |

## Future Considerations

If unification becomes necessary in the future:

### Option 1: GraphQL for Both Apps
- Migrate commerce-hooks to use GraphQL
- Add SSE subscription support to shared hooks
- Requires: GraphQL client in shared library, subscription infrastructure

### Option 2: Adapter Pattern
- Create GraphQL adapter in ecommerce-web that implements commerce-hooks interface
- Shared UI components could still be used
- Requires: Careful interface design, type compatibility

### Option 3: Maintain Separate Implementations
- Continue current approach
- ecommerce-web and kiosk have different needs
- Shared libraries for kiosk, custom implementations for ecommerce-web

## Recommendation

**Maintain separate implementations** (Option 3) unless there's a compelling business reason to unify. The apps serve different purposes:

- **ecommerce-web**: Rich customer experience, real-time features, complex UX
- **self-checkout-kiosk**: Fast, simple, touch-optimized, REST-based

Code sharing should happen at the appropriate level (design tokens, base UI components, types) rather than forcing architectural convergence.

## Verification

All ecommerce-web functionality remains unchanged and working:

```bash
pnpm nx build ecommerce-web  # ✅ Should pass
pnpm nx test ecommerce-web   # ✅ Should pass
pnpm nx lint ecommerce-web   # ✅ Should pass
```

## Related Plans

- `044_SELF_CHECKOUT_KIOSK.md` - Parent plan
- `044A_SHARED_COMMERCE_COMPONENTS.md` - This plan (Phase 4 deferred)
- `046_CART_GRAPHQL_CLIENT_ALIGNMENT.md` - GraphQL migration that created incompatibility

## Status

- Phase 1: ✅ COMPLETE - UI primitives
- Phase 2: ✅ COMPLETE - commerce-ui library
- Phase 3: ✅ COMPLETE - commerce-hooks library
- Phase 4: ⚠️ DEFERRED - ecommerce-web integration (architectural incompatibility)

**Overall Status**: COMPLETE (with documented exception for Phase 4)

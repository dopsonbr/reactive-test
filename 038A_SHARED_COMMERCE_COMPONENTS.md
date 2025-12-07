# 038A_SHARED_COMMERCE_COMPONENTS

**Status: DRAFT**

---

## Overview

Extract reusable commerce components and hooks from `ecommerce-web` into shared libraries, enabling code reuse between the ecommerce web app and the new kiosk app.

**Related Plans:**
- `038_SELF_CHECKOUT_KIOSK.md` - Parent initiative
- `038B_KIOSK_APP_SCAFFOLD.md` - Depends on this plan

## Goals

1. Create `commerce-ui` library with shared product/cart display components
2. Create `commerce-hooks` library with TanStack Query hooks for products, cart, customers
3. Add new UI primitives (NumericKeypad, QuantitySelector, etc.) to `ui-components`
4. Update `ecommerce-web` to consume shared libraries (no behavior change)

## References

**Standards:**
- `docs/standards/frontend/components.md` - Component patterns (smart vs presentational)
- `docs/standards/frontend/code-organization.md` - Library structure

---

## Phase 1: New UI Primitives

**Prereqs:** Existing `ui-components` library
**Blockers:** None

### 1.1 NumericKeypad Component

**Files:**
- CREATE: `libs/frontend/shared-ui/ui-components/src/components/ui/numeric-keypad.tsx`
- CREATE: `libs/frontend/shared-ui/ui-components/src/components/ui/numeric-keypad.test.tsx`
- CREATE: `libs/frontend/shared-ui/ui-components/src/components/ui/numeric-keypad.stories.tsx`
- MODIFY: `libs/frontend/shared-ui/ui-components/src/index.ts`

**Implementation:**
```typescript
interface NumericKeypadProps {
  value: string;
  onChange: (value: string) => void;
  maxLength?: number;
  showDecimal?: boolean;
  onSubmit?: () => void;
}

// 3x4 grid: 1-9, decimal/0/backspace
// Large touch targets (min 64x64px for kiosk)
```

### 1.2 QuantitySelector Component

**Files:**
- CREATE: `libs/frontend/shared-ui/ui-components/src/components/ui/quantity-selector.tsx`
- CREATE: `libs/frontend/shared-ui/ui-components/src/components/ui/quantity-selector.test.tsx`
- CREATE: `libs/frontend/shared-ui/ui-components/src/components/ui/quantity-selector.stories.tsx`

**Implementation:**
```typescript
interface QuantitySelectorProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';  // lg for kiosk touch
  disabled?: boolean;
}

// [-] [value] [+] layout with configurable button sizes
```

### 1.3 PriceDisplay Component

**Files:**
- CREATE: `libs/frontend/shared-ui/ui-components/src/components/ui/price-display.tsx`
- CREATE: `libs/frontend/shared-ui/ui-components/src/components/ui/price-display.test.tsx`

**Implementation:**
```typescript
interface PriceDisplayProps {
  price: number;
  originalPrice?: number;  // For showing discounts
  currency?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showCents?: boolean;
}

// Handles formatting, strikethrough for original price
```

### 1.4 Badge Component

**Files:**
- CREATE: `libs/frontend/shared-ui/ui-components/src/components/ui/badge.tsx`
- CREATE: `libs/frontend/shared-ui/ui-components/src/components/ui/badge.test.tsx`

**Implementation:**
```typescript
const badgeVariants = cva('...', {
  variants: {
    variant: {
      default: '...',
      secondary: '...',
      success: '...',    // In stock
      warning: '...',    // Low stock
      destructive: '...', // Out of stock
    }
  }
});
```

### 1.5 Spinner Component

**Files:**
- CREATE: `libs/frontend/shared-ui/ui-components/src/components/ui/spinner.tsx`

**Implementation:**
```typescript
interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}
// Simple animated spinner using Tailwind animate-spin
```

### 1.6 Alert Component

**Files:**
- CREATE: `libs/frontend/shared-ui/ui-components/src/components/ui/alert.tsx`

**Implementation:**
```typescript
const alertVariants = cva('...', {
  variants: {
    variant: {
      default: '...',
      info: '...',
      success: '...',
      warning: '...',
      destructive: '...',
    }
  }
});
// Icon + title + description layout
```

---

## Phase 2: Commerce UI Library

**Prereqs:** Phase 1 complete
**Blockers:** None

### 2.1 Create Library Structure

**Files:**
- CREATE: `libs/frontend/shared-ui/commerce-ui/project.json`
- CREATE: `libs/frontend/shared-ui/commerce-ui/tsconfig.json`
- CREATE: `libs/frontend/shared-ui/commerce-ui/tsconfig.lib.json`
- CREATE: `libs/frontend/shared-ui/commerce-ui/vite.config.ts`
- CREATE: `libs/frontend/shared-ui/commerce-ui/src/index.ts`
- MODIFY: `tsconfig.base.json` - Add path alias

**Implementation:**
```json
// project.json
{
  "name": "commerce-ui",
  "tags": ["type:ui", "scope:shared", "platform:web"]
}
```

Path alias: `@reactive-platform/commerce-ui`

### 2.2 ProductCard Component

**Files:**
- CREATE: `libs/frontend/shared-ui/commerce-ui/src/components/ProductCard/ProductCard.tsx`
- CREATE: `libs/frontend/shared-ui/commerce-ui/src/components/ProductCard/ProductCard.test.tsx`
- CREATE: `libs/frontend/shared-ui/commerce-ui/src/components/ProductCard/index.ts`

**Implementation:**
```typescript
interface ProductCardProps {
  product: Product;
  onAddToCart?: (sku: string, quantity: number) => void;
  onNavigate?: (sku: string) => void;  // Abstract navigation
  showQuantitySelector?: boolean;
  size?: 'compact' | 'default' | 'large';  // large for kiosk
  isLoading?: boolean;
}
```

Extract from `apps/ecommerce-web/src/features/products/components/ProductCard.tsx`, removing TanStack Router dependency.

### 2.3 CartItemRow Component

**Files:**
- CREATE: `libs/frontend/shared-ui/commerce-ui/src/components/CartItemRow/CartItemRow.tsx`
- CREATE: `libs/frontend/shared-ui/commerce-ui/src/components/CartItemRow/CartItemRow.test.tsx`
- CREATE: `libs/frontend/shared-ui/commerce-ui/src/components/CartItemRow/index.ts`

**Implementation:**
```typescript
interface CartItemRowProps {
  item: CartItem;
  onUpdateQuantity: (sku: string, quantity: number) => void;
  onRemove: (sku: string) => void;
  size?: 'compact' | 'default' | 'large';
  showImage?: boolean;
}
```

### 2.4 CartSummary Component

**Files:**
- CREATE: `libs/frontend/shared-ui/commerce-ui/src/components/CartSummary/CartSummary.tsx`
- CREATE: `libs/frontend/shared-ui/commerce-ui/src/components/CartSummary/CartSummary.test.tsx`

**Implementation:**
```typescript
interface CartSummaryProps {
  subtotal: number;
  tax: number;
  total: number;
  discounts?: AppliedDiscount[];
  showCheckoutButton?: boolean;
  onCheckout?: () => void;
  checkoutLabel?: string;  // "Checkout" vs "Pay Now"
}
```

### 2.5 ScannedItemDisplay Component (Kiosk-specific but shared)

**Files:**
- CREATE: `libs/frontend/shared-ui/commerce-ui/src/components/ScannedItemDisplay/ScannedItemDisplay.tsx`

**Implementation:**
```typescript
interface ScannedItemDisplayProps {
  product: Product | null;
  isLoading?: boolean;
  error?: string;
  onAddToCart: () => void;
  onCancel: () => void;
}
// Large product display for post-scan confirmation
```

---

## Phase 3: Commerce Hooks Library

**Prereqs:** None (can run parallel with Phase 2)
**Blockers:** None

### 3.1 Create Library Structure

**Files:**
- CREATE: `libs/frontend/shared-data/commerce-hooks/project.json`
- CREATE: `libs/frontend/shared-data/commerce-hooks/tsconfig.json`
- CREATE: `libs/frontend/shared-data/commerce-hooks/src/index.ts`
- MODIFY: `tsconfig.base.json` - Add path alias

Path alias: `@reactive-platform/commerce-hooks`

### 3.2 Shared Types

**Files:**
- CREATE: `libs/frontend/shared-data/commerce-hooks/src/types/product.ts`
- CREATE: `libs/frontend/shared-data/commerce-hooks/src/types/cart.ts`
- CREATE: `libs/frontend/shared-data/commerce-hooks/src/types/customer.ts`
- CREATE: `libs/frontend/shared-data/commerce-hooks/src/types/checkout.ts`
- CREATE: `libs/frontend/shared-data/commerce-hooks/src/types/index.ts`

**Implementation:**
Extract types from `apps/ecommerce-web/src/features/*/types/`:
- Product, ProductSearchParams, ProductSearchResult
- Cart, CartItem, AddToCartRequest, UpdateCartItemRequest
- Customer, LoyaltyInfo
- CheckoutSummary, OrderResponse

### 3.3 Product Hooks

**Files:**
- CREATE: `libs/frontend/shared-data/commerce-hooks/src/hooks/useProducts.ts`
- CREATE: `libs/frontend/shared-data/commerce-hooks/src/hooks/useProduct.ts`

**Implementation:**
```typescript
export const productKeys = {
  all: ['products'] as const,
  lists: () => [...productKeys.all, 'list'] as const,
  list: (params: ProductSearchParams) => [...productKeys.lists(), params] as const,
  details: () => [...productKeys.all, 'detail'] as const,
  detail: (sku: string) => [...productKeys.details(), sku] as const,
};

export function useProducts(params?: ProductSearchParams) { ... }
export function useProduct(sku: string) { ... }
export function useProductMutation() { ... }  // For scan lookup
```

### 3.4 Cart Hooks

**Files:**
- CREATE: `libs/frontend/shared-data/commerce-hooks/src/hooks/useCart.ts`

**Implementation:**
```typescript
export const cartKeys = {
  all: ['cart'] as const,
  detail: (id: string) => [...cartKeys.all, id] as const,
};

export function useCart(cartId?: string) { ... }
export function useCreateCart() { ... }
export function useAddToCart() { ... }
export function useUpdateCartItem() { ... }
export function useRemoveFromCart() { ... }
export function useClearCart() { ... }  // For kiosk reset
```

### 3.5 Customer Hooks

**Files:**
- CREATE: `libs/frontend/shared-data/commerce-hooks/src/hooks/useCustomerLookup.ts`

**Implementation:**
```typescript
export function useCustomerLookup() {
  return useMutation({
    mutationFn: async (input: { phone?: string; email?: string }) => {
      const params = input.phone ? { phone: input.phone } : { email: input.email };
      const results = await apiClient<Customer[]>('/customers/search', { params });
      return results.length > 0 ? results[0] : null;  // Binary match
    },
  });
}
```

### 3.6 Checkout Hooks

**Files:**
- CREATE: `libs/frontend/shared-data/commerce-hooks/src/hooks/useCheckout.ts`

**Implementation:**
```typescript
export function useInitiateCheckout() { ... }
export function useCompleteCheckout() { ... }
export function useOrder(orderId: string) { ... }
```

---

## Phase 4: Update ecommerce-web

**Prereqs:** Phases 2 and 3 complete
**Blockers:** None

### 4.1 Update Imports in ecommerce-web

**Files:**
- MODIFY: `apps/ecommerce-web/src/features/products/components/ProductCard.tsx` → Import from `@reactive-platform/commerce-ui`
- MODIFY: `apps/ecommerce-web/src/features/products/api/useProducts.ts` → Re-export from `@reactive-platform/commerce-hooks`
- MODIFY: `apps/ecommerce-web/src/features/cart/api/useCart.ts` → Re-export from `@reactive-platform/commerce-hooks`
- MODIFY: `apps/ecommerce-web/src/features/cart/components/CartItemRow.tsx` → Import from `@reactive-platform/commerce-ui`

**Implementation:**
Thin wrappers that re-export shared code with app-specific defaults:

```typescript
// apps/ecommerce-web/src/features/products/api/useProducts.ts
export { useProducts, useProduct, productKeys } from '@reactive-platform/commerce-hooks';
export type { Product, ProductSearchParams } from '@reactive-platform/commerce-hooks';
```

### 4.2 Verify No Regressions

Run all existing tests to ensure behavior unchanged:
```bash
pnpm nx test ecommerce-web
pnpm nx e2e ecommerce-web-e2e
```

---

## Files Summary

| Action | File | Purpose |
|--------|------|---------|
| CREATE | `libs/frontend/shared-ui/ui-components/src/components/ui/numeric-keypad.tsx` | Touch keypad |
| CREATE | `libs/frontend/shared-ui/ui-components/src/components/ui/quantity-selector.tsx` | +/- quantity |
| CREATE | `libs/frontend/shared-ui/ui-components/src/components/ui/price-display.tsx` | Currency format |
| CREATE | `libs/frontend/shared-ui/ui-components/src/components/ui/badge.tsx` | Status badges |
| CREATE | `libs/frontend/shared-ui/ui-components/src/components/ui/spinner.tsx` | Loading spinner |
| CREATE | `libs/frontend/shared-ui/ui-components/src/components/ui/alert.tsx` | Alert messages |
| CREATE | `libs/frontend/shared-ui/commerce-ui/` | Commerce UI library |
| CREATE | `libs/frontend/shared-data/commerce-hooks/` | Commerce hooks library |
| MODIFY | `tsconfig.base.json` | Add path aliases |
| MODIFY | `apps/ecommerce-web/src/features/**` | Use shared libs |

---

## Testing Strategy

**Unit Tests:**
- Each new UI component has test file with RTL
- Each hook has test file with mock Query Client
- A11y tests for all new components (axe-core)

**Integration Tests:**
- ecommerce-web continues to pass all existing tests
- No visual regressions in existing functionality

---

## Documentation Updates

| File | Update Required |
|------|-----------------|
| `libs/frontend/shared-ui/commerce-ui/README.md` | Document component props and usage |
| `libs/frontend/shared-data/commerce-hooks/README.md` | Document hook APIs |
| `libs/frontend/AGENTS.md` | Add new libraries |
| `CLAUDE.md` | Add new library paths |

---

## Checklist

- [ ] Phase 1: UI primitives added to ui-components
- [ ] Phase 2: commerce-ui library created
- [ ] Phase 3: commerce-hooks library created
- [ ] Phase 4: ecommerce-web updated to use shared libs
- [ ] All tests passing
- [ ] Documentation updated

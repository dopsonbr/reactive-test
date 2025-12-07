# 038C_KIOSK_FEATURES

**Status: DRAFT**

---

## Overview

Implement the core kiosk features: product scanning, cart management, loyalty lookup, and checkout flow.

**Related Plans:**
- `038_SELF_CHECKOUT_KIOSK.md` - Parent initiative
- `038A_SHARED_COMMERCE_COMPONENTS.md` - Prerequisite (shared UI/hooks)
- `038B_KIOSK_APP_SCAFFOLD.md` - Prerequisite (app structure)
- `038D_KIOSK_E2E_TESTING.md` - Test coverage for these features

## Goals

1. Implement barcode scanner integration with manual SKU fallback
2. Build cart review with touch-optimized quantity controls
3. Create loyalty lookup with phone/email binary match
4. Integrate checkout flow with discount calculation and payment
5. Build confirmation screen with receipt display

## References

**Standards:**
- `docs/standards/frontend/state-management.md` - TanStack Query patterns
- `docs/standards/frontend/error-handling.md` - Error boundaries

---

## Phase 1: Product Scanning

**Prereqs:** 038B complete (app scaffold), product-service running
**Blockers:** None

### 1.1 Scanner Input Hook

**Files:**
- CREATE: `apps/kiosk-web/src/features/scan/hooks/useScannerInput.ts`

**Implementation:**
```typescript
interface ScannerInputOptions {
  onScan: (barcode: string) => void;
  minLength?: number;      // Minimum barcode length (default: 8)
  maxLength?: number;      // Maximum barcode length (default: 20)
  timeout?: number;        // Ms between keystrokes before reset (default: 50)
  enabled?: boolean;       // Disable during modals
}

export function useScannerInput(options: ScannerInputOptions) {
  // Barcode scanners send keystrokes rapidly ending with Enter
  // Accumulate keystrokes, detect Enter or timeout
  // Filter out non-barcode input (too slow = human typing)

  useEffect(() => {
    let buffer = '';
    let lastKeyTime = 0;

    const handleKeyDown = (e: KeyboardEvent) => {
      const now = Date.now();

      // Reset if too much time between keys (human typing)
      if (now - lastKeyTime > options.timeout) {
        buffer = '';
      }
      lastKeyTime = now;

      if (e.key === 'Enter' && buffer.length >= options.minLength) {
        options.onScan(buffer);
        buffer = '';
      } else if (e.key.length === 1) {
        buffer += e.key;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [options]);
}
```

### 1.2 Product Lookup Hook

**Files:**
- CREATE: `apps/kiosk-web/src/features/scan/hooks/useProductScan.ts`

**Implementation:**
```typescript
export function useProductScan() {
  const queryClient = useQueryClient();
  const { setCartId, cartScope } = useKioskSession();
  const addToCart = useAddToCart(cartScope());

  const lookupMutation = useMutation({
    mutationFn: (sku: string) => apiClient<Product>(`/products/${sku}`),
    onSuccess: (product) => {
      queryClient.setQueryData(['product', product.sku], product);
    },
  });

  const scanAndAdd = async (barcode: string) => {
    const product = await lookupMutation.mutateAsync(barcode);
    if (product.inStock) {
      await addToCart.mutateAsync({ sku: product.sku, quantity: 1 });
    }
    return product;
  };

  return {
    lookup: lookupMutation,
    scanAndAdd,
    isLoading: lookupMutation.isPending || addToCart.isPending,
    error: lookupMutation.error || addToCart.error,
  };
}
```

### 1.3 Scan Page

**Files:**
- CREATE: `apps/kiosk-web/src/features/scan/pages/ScanPage.tsx`

**Implementation:**
```typescript
export function ScanPage() {
  const { scanAndAdd, isLoading, error } = useProductScan();
  const [lastScanned, setLastScanned] = useState<Product | null>(null);
  const [showManualEntry, setShowManualEntry] = useState(false);

  useScannerInput({
    onScan: async (barcode) => {
      const product = await scanAndAdd(barcode);
      setLastScanned(product);
    },
    enabled: !showManualEntry,
  });

  return (
    <KioskLayout title="Scan Items">
      <div className="flex flex-col h-full">
        {/* Scan area - large visual feedback */}
        <ScanFeedback
          isLoading={isLoading}
          lastScanned={lastScanned}
          error={error}
        />

        {/* Cart mini-preview */}
        <CartMiniPreview />

        {/* Actions */}
        <div className="flex gap-4 p-6">
          <Button size="lg" onClick={() => setShowManualEntry(true)}>
            Enter SKU Manually
          </Button>
          <Button size="lg" variant="secondary" onClick={() => navigate('/cart')}>
            Review Cart
          </Button>
        </div>
      </div>

      <ManualSkuDialog
        open={showManualEntry}
        onClose={() => setShowManualEntry(false)}
        onSubmit={scanAndAdd}
      />
    </KioskLayout>
  );
}
```

### 1.4 Scan Feedback Component

**Files:**
- CREATE: `apps/kiosk-web/src/features/scan/components/ScanFeedback.tsx`

**Implementation:**
```typescript
interface ScanFeedbackProps {
  isLoading: boolean;
  lastScanned: Product | null;
  error: Error | null;
}

// Large visual area showing:
// - Idle: "Scan barcode or enter SKU"
// - Loading: Spinner animation
// - Success: Product image, name, price, "Added to cart!"
// - Error: "Product not found" or "Out of stock"
// Audio feedback (optional): beep on success, buzz on error
```

### 1.5 Manual SKU Entry Dialog

**Files:**
- CREATE: `apps/kiosk-web/src/features/scan/components/ManualSkuDialog.tsx`

**Implementation:**
```typescript
// Full-screen dialog with NumericKeypad
// SKU display field at top
// 0-9 keypad with backspace and submit
// Cancel button to close
```

### 1.6 Cart Mini Preview

**Files:**
- CREATE: `apps/kiosk-web/src/features/scan/components/CartMiniPreview.tsx`

**Implementation:**
```typescript
// Compact view showing:
// - Item count: "5 items in cart"
// - Running total: "$123.45"
// - Last 2-3 items added (thumbnails)
```

---

## Phase 2: Cart Review

**Prereqs:** Phase 1 complete, cart-service running
**Blockers:** None

### 2.1 Cart Page

**Files:**
- CREATE: `apps/kiosk-web/src/features/cart/pages/CartPage.tsx`

**Implementation:**
```typescript
export function CartPage() {
  const { cartScope } = useKioskSession();
  const { data: cart, isLoading } = useCart(cartScope());
  const navigate = useNavigate();

  if (!cart || cart.items.length === 0) {
    return <EmptyCartScreen onStartShopping={() => navigate('/scan')} />;
  }

  return (
    <KioskLayout title="Review Your Cart">
      <div className="flex h-full">
        {/* Item list - scrollable */}
        <div className="flex-1 overflow-auto p-4">
          {cart.items.map((item) => (
            <KioskCartItem key={item.sku} item={item} />
          ))}
        </div>

        {/* Summary - fixed sidebar */}
        <div className="w-96 bg-muted p-6">
          <CartSummary
            subtotal={cart.subtotal}
            tax={cart.tax}
            total={cart.total}
          />
          <div className="mt-6 space-y-4">
            <Button size="lg" className="w-full" onClick={() => navigate('/loyalty')}>
              Continue to Loyalty
            </Button>
            <Button size="lg" variant="outline" className="w-full" onClick={() => navigate('/scan')}>
              Continue Scanning
            </Button>
          </div>
        </div>
      </div>
    </KioskLayout>
  );
}
```

### 2.2 Kiosk Cart Item Component

**Files:**
- CREATE: `apps/kiosk-web/src/features/cart/components/KioskCartItem.tsx`

**Implementation:**
```typescript
interface KioskCartItemProps {
  item: CartItem;
}

// Large touch-friendly cart item:
// - Product image (larger than web)
// - Name and price
// - QuantitySelector (size="lg")
// - Remove button (with confirmation)
// - Line total
```

### 2.3 Empty Cart Screen

**Files:**
- CREATE: `apps/kiosk-web/src/features/cart/components/EmptyCartScreen.tsx`

**Implementation:**
```typescript
// Full-screen empty state
// "Your cart is empty" message
// Large "Start Scanning" button
// Cancel transaction option
```

---

## Phase 3: Loyalty Lookup

**Prereqs:** Phase 2 complete, customer-service running
**Blockers:** None

### 3.1 Loyalty Page

**Files:**
- CREATE: `apps/kiosk-web/src/features/loyalty/pages/LoyaltyPage.tsx`

**Implementation:**
```typescript
export function LoyaltyPage() {
  const [inputMode, setInputMode] = useState<'phone' | 'email'>('phone');
  const [value, setValue] = useState('');
  const lookup = useCustomerLookup();
  const { linkCustomer } = useKioskSession();
  const navigate = useNavigate();

  const handleSubmit = async () => {
    const customer = await lookup.mutateAsync(
      inputMode === 'phone' ? { phone: value } : { email: value }
    );
    if (customer) {
      linkCustomer(customer.id);
    }
    navigate('/checkout');
  };

  return (
    <KioskLayout title="Loyalty Rewards">
      <div className="flex flex-col items-center justify-center h-full p-8">
        {/* Mode toggle */}
        <div className="flex gap-4 mb-8">
          <Button
            size="lg"
            variant={inputMode === 'phone' ? 'default' : 'outline'}
            onClick={() => setInputMode('phone')}
          >
            Phone Number
          </Button>
          <Button
            size="lg"
            variant={inputMode === 'email' ? 'default' : 'outline'}
            onClick={() => setInputMode('email')}
          >
            Email Address
          </Button>
        </div>

        {/* Input area */}
        {inputMode === 'phone' ? (
          <PhoneInput value={value} onChange={setValue} />
        ) : (
          <EmailInput value={value} onChange={setValue} />
        )}

        {/* Result display */}
        <LoyaltyResult
          isLoading={lookup.isPending}
          customer={lookup.data}
          error={lookup.error}
        />

        {/* Actions */}
        <div className="flex gap-4 mt-8">
          <Button size="lg" onClick={handleSubmit} disabled={!value}>
            Look Up Account
          </Button>
          <Button size="lg" variant="outline" onClick={() => navigate('/checkout')}>
            Skip - No Loyalty Account
          </Button>
        </div>
      </div>
    </KioskLayout>
  );
}
```

### 3.2 Phone Input Component

**Files:**
- CREATE: `apps/kiosk-web/src/features/loyalty/components/PhoneInput.tsx`

**Implementation:**
```typescript
// Display formatted phone: (555) 123-4567
// NumericKeypad for input
// Auto-format as user types
// Validate 10-digit US phone
```

### 3.3 Email Input Component

**Files:**
- CREATE: `apps/kiosk-web/src/features/loyalty/components/EmailInput.tsx`

**Implementation:**
```typescript
// On-screen keyboard for email entry
// Common domain suggestions (@gmail.com, etc.)
// Basic email validation
```

### 3.4 Loyalty Result Component

**Files:**
- CREATE: `apps/kiosk-web/src/features/loyalty/components/LoyaltyResult.tsx`

**Implementation:**
```typescript
interface LoyaltyResultProps {
  isLoading: boolean;
  customer: Customer | null | undefined;
  error: Error | null;
}

// States:
// - Loading: Spinner
// - Found: "Welcome back, [Name]!" with loyalty tier/points
// - Not found: "No account found with that [phone/email]"
// - Error: "Unable to look up account. Try again or skip."
```

---

## Phase 4: Checkout & Payment

**Prereqs:** Phase 3 complete, checkout-service and discount-service running
**Blockers:** None

### 4.1 Checkout Page

**Files:**
- CREATE: `apps/kiosk-web/src/features/checkout/pages/CheckoutPage.tsx`

**Implementation:**
```typescript
export function CheckoutPage() {
  const { cartId, customerId, setCheckoutId } = useKioskSession();
  const initiate = useInitiateCheckout();
  const complete = useCompleteCheckout();
  const navigate = useNavigate();

  // Auto-initiate checkout on page load
  useEffect(() => {
    if (cartId) {
      initiate.mutate({
        cartId,
        customerId: customerId || undefined,
        fulfillmentType: 'IMMEDIATE',
      }, {
        onSuccess: (summary) => setCheckoutId(summary.checkoutId),
      });
    }
  }, [cartId, customerId]);

  const handlePayment = async (paymentDetails: PaymentDetails) => {
    const order = await complete.mutateAsync({
      checkoutId: initiate.data!.checkoutId,
      paymentMethod: paymentDetails.method,
      paymentDetails,
    });
    navigate('/confirm', { state: { orderId: order.orderId } });
  };

  return (
    <KioskLayout title="Complete Your Purchase">
      <div className="flex h-full">
        {/* Order summary */}
        <div className="flex-1 p-6">
          <CheckoutOrderSummary summary={initiate.data} />
          <AppliedDiscounts discounts={initiate.data?.discounts} />
        </div>

        {/* Payment section */}
        <div className="w-1/2 bg-muted p-6">
          <PaymentSection
            total={initiate.data?.total || 0}
            onPayment={handlePayment}
            isProcessing={complete.isPending}
          />
        </div>
      </div>
    </KioskLayout>
  );
}
```

### 4.2 Checkout Order Summary

**Files:**
- CREATE: `apps/kiosk-web/src/features/checkout/components/CheckoutOrderSummary.tsx`

**Implementation:**
```typescript
// Displays:
// - All items with quantities and prices
// - Subtotal
// - Discounts applied (loyalty, promos)
// - Tax
// - Final total (large, prominent)
```

### 4.3 Applied Discounts Display

**Files:**
- CREATE: `apps/kiosk-web/src/features/checkout/components/AppliedDiscounts.tsx`

**Implementation:**
```typescript
interface AppliedDiscount {
  type: 'loyalty' | 'promo' | 'markdown';
  description: string;
  amount: number;
}

// Show each discount with:
// - Icon by type
// - Description
// - Savings amount in green
```

### 4.4 Payment Section

**Files:**
- CREATE: `apps/kiosk-web/src/features/checkout/components/PaymentSection.tsx`

**Implementation:**
```typescript
// For MVP: Simulated payment
// - Display total prominently
// - "Pay with Card" button (simulates success)
// - Loading state during processing

// Future: Integration with payment terminal
// - Card reader status display
// - Insert/tap/swipe instructions
// - Processing animation
```

---

## Phase 5: Confirmation & Receipt

**Prereqs:** Phase 4 complete
**Blockers:** None

### 5.1 Confirmation Page

**Files:**
- CREATE: `apps/kiosk-web/src/features/checkout/pages/ConfirmationPage.tsx`

**Implementation:**
```typescript
export function ConfirmationPage() {
  const { state } = useLocation();
  const { resetTransaction } = useKioskSession();
  const { data: order } = useOrder(state.orderId);

  // Auto-reset after 30 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      resetTransaction();
      navigate('/');
    }, 30000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <KioskLayout title="Thank You!">
      <div className="flex flex-col items-center justify-center h-full p-8">
        <CheckCircle className="w-24 h-24 text-green-500 mb-6" />
        <h1 className="text-kiosk-2xl font-bold mb-4">
          Payment Successful!
        </h1>
        <p className="text-kiosk-lg text-muted-foreground mb-8">
          Order #{order?.orderNumber}
        </p>

        <ReceiptOptions orderId={state.orderId} />

        <Button
          size="lg"
          className="mt-12"
          onClick={() => {
            resetTransaction();
            navigate('/');
          }}
        >
          Done - Start New Transaction
        </Button>
      </div>
    </KioskLayout>
  );
}
```

### 5.2 Receipt Options

**Files:**
- CREATE: `apps/kiosk-web/src/features/checkout/components/ReceiptOptions.tsx`

**Implementation:**
```typescript
// Options:
// - Print receipt (if printer connected)
// - Email receipt (enter email with keyboard)
// - No receipt needed
```

---

## Files Summary

| Action | File | Purpose |
|--------|------|---------|
| CREATE | `apps/kiosk-web/src/features/scan/hooks/useScannerInput.ts` | Barcode scanner |
| CREATE | `apps/kiosk-web/src/features/scan/hooks/useProductScan.ts` | Product lookup |
| CREATE | `apps/kiosk-web/src/features/scan/pages/ScanPage.tsx` | Scan screen |
| CREATE | `apps/kiosk-web/src/features/scan/components/*.tsx` | Scan UI components |
| CREATE | `apps/kiosk-web/src/features/cart/pages/CartPage.tsx` | Cart review |
| CREATE | `apps/kiosk-web/src/features/cart/components/*.tsx` | Cart UI components |
| CREATE | `apps/kiosk-web/src/features/loyalty/pages/LoyaltyPage.tsx` | Loyalty lookup |
| CREATE | `apps/kiosk-web/src/features/loyalty/components/*.tsx` | Loyalty UI components |
| CREATE | `apps/kiosk-web/src/features/checkout/pages/CheckoutPage.tsx` | Checkout flow |
| CREATE | `apps/kiosk-web/src/features/checkout/pages/ConfirmationPage.tsx` | Confirmation |
| CREATE | `apps/kiosk-web/src/features/checkout/components/*.tsx` | Checkout UI components |

---

## Checklist

- [ ] Phase 1: Product scanning working
- [ ] Phase 2: Cart review working
- [ ] Phase 3: Loyalty lookup working
- [ ] Phase 4: Checkout flow working
- [ ] Phase 5: Confirmation screen working
- [ ] All features integrated end-to-end

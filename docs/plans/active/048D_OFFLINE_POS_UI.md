# 048D_OFFLINE_POS_UI

**Status: DRAFT**

---

## Overview

Implement the HTML templates, vanilla JavaScript modules, and CSS styling for the Offline POS application. The UI is a multi-page application with 5 screens: login, scan, cart, payment, and complete.

**Related Plans:**
- 048_OFFLINE_POS - Parent plan
- 048A_OFFLINE_POS_GO_INFRASTRUCTURE - Prerequisite
- 048E_OFFLINE_POS_PERIPHERAL - Depends on this for peripheral.js

## Goals

1. Go HTML templates for all 5 screens
2. Vanilla JavaScript ESM modules (no build step)
3. Minimal CSS styling (Pico CSS base + custom)
4. Status polling for connectivity banners
5. Cart operations via fetch API

## References

**ADRs:**
- `docs/ADRs/014_offline_pos_technology_stack.md` - Vanilla ESM decision

**Design:**
- `docs/ideas/2025-12-09-offline-pos-design.md` - User flow section

---

## Phase 1: Base Layout and Styling

**Prereqs:** 048A complete
**Blockers:** None

### 1.1 Base Layout Template

**Files:**
- CREATE: `apps/offline-pos/templates/layout.html`

**Implementation:**

```html
{{define "layout"}}
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Offline POS - {{.Title}}</title>
    <link rel="stylesheet" href="/static/css/pico.min.css">
    <link rel="stylesheet" href="/static/css/styles.css">
</head>
<body>
    <header class="container">
        <nav>
            <strong>OFFLINE POS</strong>
            <span class="store-id">Store #{{.StoreNumber}}</span>
            {{if .Operator}}
            <span class="operator">{{.Operator.Name}}</span>
            {{end}}
        </nav>
        <div id="status-banner" class="banner hidden"></div>
    </header>

    <main class="container">
        {{template "content" .}}
    </main>

    <script type="module">
        import { pollStatus } from '/static/js/status.js';
        pollStatus();
    </script>
    {{block "scripts" .}}{{end}}
</body>
</html>
{{end}}
```

### 1.2 CSS Styling

**Files:**
- CREATE: `apps/offline-pos/static/css/styles.css`

**Implementation:**

```css
/* Offline POS Custom Styles */

:root {
    --offline-banner: #ffc107;
    --online-banner: #28a745;
    --error-banner: #dc3545;
}

/* Header */
header nav {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.store-id, .operator {
    font-size: 0.875rem;
    color: var(--muted-color);
}

/* Status Banner */
.banner {
    padding: 0.5rem 1rem;
    text-align: center;
    font-weight: 500;
}

.banner.offline {
    background: var(--offline-banner);
    color: #000;
}

.banner.online {
    background: var(--online-banner);
    color: #fff;
}

.banner.hidden {
    display: none;
}

/* Login */
.pin-input {
    font-size: 2rem;
    text-align: center;
    letter-spacing: 0.5rem;
    max-width: 200px;
}

/* Scan Screen */
.scan-area {
    min-height: 200px;
    border: 2px dashed var(--muted-border-color);
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 1rem;
}

.scan-feedback {
    padding: 1rem;
    background: var(--card-background-color);
    border-radius: 4px;
    margin-bottom: 1rem;
}

/* Cart */
.cart-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem 0;
    border-bottom: 1px solid var(--muted-border-color);
}

.cart-item .name {
    flex: 1;
}

.cart-item .qty-controls {
    display: flex;
    gap: 0.5rem;
    align-items: center;
}

.cart-item .qty-controls button {
    width: 2rem;
    height: 2rem;
    padding: 0;
}

.cart-totals {
    margin-top: 1rem;
    text-align: right;
}

/* Payment */
.payment-buttons {
    display: flex;
    gap: 1rem;
    margin-top: 2rem;
}

.payment-buttons button {
    flex: 1;
    padding: 2rem;
    font-size: 1.5rem;
}

.payment-status {
    text-align: center;
    padding: 2rem;
    font-size: 1.25rem;
}

/* Complete */
.transaction-complete {
    text-align: center;
    padding: 2rem;
}

.transaction-id {
    font-family: monospace;
    font-size: 1.25rem;
    background: var(--card-background-color);
    padding: 0.5rem 1rem;
    border-radius: 4px;
}
```

### 1.3 Pico CSS

**Files:**
- CREATE: `apps/offline-pos/static/css/pico.min.css`

Download Pico CSS (~10KB) from https://picocss.com and save locally for offline use.

---

## Phase 2: Page Templates

**Prereqs:** Phase 1 complete
**Blockers:** None

### 2.1 Login Page

**Files:**
- CREATE: `apps/offline-pos/templates/login.html`

```html
{{define "content"}}
<article>
    <h1>Operator Login</h1>
    <form method="POST" action="/login">
        <label for="pin">Enter PIN</label>
        <input type="password"
               id="pin"
               name="pin"
               class="pin-input"
               maxlength="6"
               pattern="[0-9]{4,6}"
               inputmode="numeric"
               autocomplete="off"
               autofocus
               required>
        {{if .Error}}
        <small class="error">{{.Error}}</small>
        {{end}}
        <button type="submit">Sign In</button>
    </form>
</article>
{{end}}
```

### 2.2 Scan Page

**Files:**
- CREATE: `apps/offline-pos/templates/scan.html`

```html
{{define "content"}}
<div class="scan-area" id="scan-area">
    <span>Scan barcode or search below</span>
</div>

<div id="scan-feedback" class="scan-feedback hidden"></div>

<form id="search-form" action="/api/products/search" method="GET">
    <input type="search"
           name="q"
           id="search-input"
           placeholder="Search by name or UPC..."
           autocomplete="off">
</form>

<div id="search-results"></div>

<div class="actions">
    <a href="/cart" role="button">
        View Cart
        <span id="cart-count">({{.CartCount}})</span>
    </a>
</div>
{{end}}

{{define "scripts"}}
<script type="module">
    import { connectPeripherals, onScan } from '/static/js/peripheral.js';
    import { addToCart, updateCartCount } from '/static/js/cart.js';

    connectPeripherals('ws://localhost:9100/peripherals');

    onScan(async (barcode) => {
        const result = await addToCart(barcode);
        showFeedback(result);
        updateCartCount();
    });

    function showFeedback(result) {
        const el = document.getElementById('scan-feedback');
        el.textContent = result.success
            ? `Added: ${result.name}`
            : `Not found: ${result.upc}`;
        el.classList.remove('hidden');
        setTimeout(() => el.classList.add('hidden'), 2000);
    }
</script>
{{end}}
```

### 2.3 Cart Page

**Files:**
- CREATE: `apps/offline-pos/templates/cart.html`

```html
{{define "content"}}
<h1>Cart</h1>

{{if .Cart}}
<div class="cart-items">
    {{range .Cart}}
    <div class="cart-item" data-upc="{{.UPC}}">
        <span class="name">{{.Name}}</span>
        <div class="qty-controls">
            <button type="button" onclick="updateQty('{{.UPC}}', -1)">-</button>
            <span class="qty">{{.Quantity}}</span>
            <button type="button" onclick="updateQty('{{.UPC}}', 1)">+</button>
        </div>
        <span class="price">${{formatPrice .PriceCents}}</span>
        <button type="button" class="secondary" onclick="removeItem('{{.UPC}}')">×</button>
    </div>
    {{end}}
</div>

<div class="cart-totals">
    <div>Subtotal: ${{formatPrice .Subtotal}}</div>
    <div>Tax: ${{formatPrice .Tax}}</div>
    <div><strong>Total: ${{formatPrice .Total}}</strong></div>
</div>

<div class="actions">
    <a href="/scan" role="button" class="secondary">Add More Items</a>
    <a href="/payment" role="button">Pay</a>
</div>
{{else}}
<p>Cart is empty</p>
<a href="/scan" role="button">Start Scanning</a>
{{end}}
{{end}}

{{define "scripts"}}
<script type="module">
    import { updateCartItem, removeCartItem } from '/static/js/cart.js';

    window.updateQty = async (upc, delta) => {
        await updateCartItem(upc, delta);
        location.reload();
    };

    window.removeItem = async (upc) => {
        await removeCartItem(upc);
        location.reload();
    };
</script>
{{end}}
```

### 2.4 Payment Page

**Files:**
- CREATE: `apps/offline-pos/templates/payment.html`

```html
{{define "content"}}
<h1>Payment</h1>

<div class="payment-amount">
    <h2>Total: ${{formatPrice .Total}}</h2>
</div>

<div id="payment-status" class="payment-status hidden"></div>

<div class="payment-buttons" id="payment-options">
    <button type="button" id="btn-card" onclick="payWithCard()">
        Pay with Card
    </button>
    <button type="button" id="btn-cash" class="secondary" onclick="payWithCash()">
        Pay with Cash
    </button>
</div>

<form id="receipt-form" class="hidden">
    <label>Email for receipt (optional)</label>
    <input type="email" name="email" id="customer-email">
    <label>Phone for receipt (optional)</label>
    <input type="tel" name="phone" id="customer-phone">
</form>

<a href="/cart" class="secondary">Back to Cart</a>
{{end}}

{{define "scripts"}}
<script type="module">
    import { collectPayment, onPaymentResult } from '/static/js/peripheral.js';
    import { completeTransaction } from '/static/js/cart.js';

    const total = {{.Total}};

    window.payWithCard = async () => {
        showStatus('Insert or tap card...');
        collectPayment(total);
    };

    window.payWithCash = async () => {
        await completeTransaction('cash', null);
        location.href = '/complete';
    };

    onPaymentResult(async (result) => {
        if (result.status === 'approved') {
            await completeTransaction('card', result.authCode);
            location.href = '/complete';
        } else {
            showStatus(`Payment declined: ${result.reason}`, true);
        }
    });

    function showStatus(msg, isError = false) {
        const el = document.getElementById('payment-status');
        el.textContent = msg;
        el.classList.remove('hidden');
        el.style.color = isError ? 'var(--error-banner)' : 'inherit';
    }
</script>
{{end}}
```

### 2.5 Complete Page

**Files:**
- CREATE: `apps/offline-pos/templates/complete.html`

```html
{{define "content"}}
<div class="transaction-complete">
    <h1>Transaction Complete</h1>
    <p>Transaction ID:</p>
    <div class="transaction-id">{{.TransactionID}}</div>
    <p>Total: ${{formatPrice .Total}}</p>

    <div class="actions">
        <a href="/scan" role="button">New Transaction</a>
        <form method="POST" action="/logout" style="display:inline;">
            <button type="submit" class="secondary">Sign Out</button>
        </form>
    </div>
</div>
{{end}}

{{define "scripts"}}
<script type="module">
    import { printReceipt } from '/static/js/peripheral.js';

    // Attempt receipt print
    printReceipt({
        transactionId: '{{.TransactionID}}',
        total: {{.Total}},
        items: {{.ItemsJSON}}
    });
</script>
{{end}}
```

---

## Phase 3: JavaScript Modules

**Prereqs:** Phase 2 complete
**Blockers:** None

### 3.1 Status Polling

**Files:**
- CREATE: `apps/offline-pos/static/js/status.js`

```javascript
// status.js - Connectivity status polling

export async function pollStatus() {
    const banner = document.getElementById('status-banner');
    if (!banner) return;

    const check = async () => {
        try {
            const resp = await fetch('/api/status');
            const status = await resp.json();
            updateBanner(banner, status);
        } catch (e) {
            banner.textContent = 'System error - contact support';
            banner.className = 'banner error';
        }
    };

    // Check immediately, then every 30s
    await check();
    setInterval(check, 30000);
}

function updateBanner(banner, status) {
    if (status.online) {
        banner.textContent = 'Primary systems available. Consider using main POS.';
        banner.className = 'banner online';
    } else {
        banner.className = 'banner hidden';
    }

    // Show sync status
    if (status.pendingTransactions > 0 && status.online) {
        banner.textContent = `Syncing ${status.pendingTransactions} transactions...`;
        banner.className = 'banner online';
    }
}
```

### 3.2 Cart Operations

**Files:**
- CREATE: `apps/offline-pos/static/js/cart.js`

```javascript
// cart.js - Cart operations via fetch API

export async function addToCart(upc) {
    const resp = await fetch('/api/cart/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ upc })
    });
    return resp.json();
}

export async function updateCartItem(upc, delta) {
    await fetch('/api/cart/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ upc, delta })
    });
}

export async function removeCartItem(upc) {
    await fetch('/api/cart/remove', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ upc })
    });
}

export async function updateCartCount() {
    const resp = await fetch('/api/cart');
    const cart = await resp.json();
    const countEl = document.getElementById('cart-count');
    if (countEl) {
        countEl.textContent = `(${cart.items?.length || 0})`;
    }
}

export async function completeTransaction(method, authCode) {
    const email = document.getElementById('customer-email')?.value;
    const phone = document.getElementById('customer-phone')?.value;

    await fetch('/api/transaction/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            payment_method: method,
            payment_ref: authCode,
            customer_email: email,
            customer_phone: phone
        })
    });
}
```

---

## Files Summary

| Action | File | Purpose |
|--------|------|---------|
| CREATE | `apps/offline-pos/templates/layout.html` | Base HTML layout |
| CREATE | `apps/offline-pos/templates/login.html` | Login page |
| CREATE | `apps/offline-pos/templates/scan.html` | Scan/search page |
| CREATE | `apps/offline-pos/templates/cart.html` | Cart page |
| CREATE | `apps/offline-pos/templates/payment.html` | Payment page |
| CREATE | `apps/offline-pos/templates/complete.html` | Complete page |
| CREATE | `apps/offline-pos/static/css/pico.min.css` | Base CSS framework |
| CREATE | `apps/offline-pos/static/css/styles.css` | Custom styles |
| CREATE | `apps/offline-pos/static/js/status.js` | Status polling |
| CREATE | `apps/offline-pos/static/js/cart.js` | Cart operations |

## Testing Strategy

1. **Manual browser testing** - Navigate through all 5 screens
2. **Console errors** - Verify no JavaScript errors
3. **Network tab** - Verify all assets load (no CDN calls)
4. **Responsive** - Test on tablet-sized viewport

## Checklist

- [ ] All 5 templates render correctly
- [ ] CSS loads and styles apply
- [ ] Status polling works
- [ ] Cart operations work via fetch
- [ ] No external CDN dependencies
- [ ] Works with JavaScript disabled (degraded)

// cart.js - Cart operations via fetch API

export async function addToCart(upc) {
    const resp = await fetch('/api/cart/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ upc })
    });
    if (!resp.ok) {
        throw new Error('Failed to add to cart');
    }
    // Server returns empty response on success
    return;
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
        // Sum up total quantity of all items
        const totalQty = cart.items?.reduce((sum, item) => sum + (item.quantity || 1), 0) || 0;
        countEl.textContent = `(${totalQty})`;
    }
    return cart;
}

export async function refreshCartPreview() {
    const cart = await updateCartCount();
    const items = cart.items || [];
    const itemCount = items.reduce((sum, item) => sum + (item.quantity || 1), 0);

    const scanArea = document.getElementById('scan-area');
    const cartPreview = document.getElementById('cart-preview');

    // Calculate totals
    const subtotal = items.reduce((sum, item) => sum + (item.price_cents * item.quantity), 0);
    const tax = Math.floor(subtotal * 825 / 10000);
    const total = subtotal + tax;

    // Update action buttons
    const actionsDiv = document.querySelector('.actions');
    if (actionsDiv && items.length > 0) {
        actionsDiv.innerHTML = `
            <a href="/cart" role="button" class="secondary">Edit Cart</a>
            <a href="/payment" role="button" class="primary">Pay $${(total / 100).toFixed(2)}</a>
        `;
    }

    // Show cart preview when more than 1 item
    if (itemCount > 1) {
        // Remove scan area if present
        if (scanArea) {
            scanArea.remove();
        }

        // Create or update cart preview
        let preview = cartPreview;
        if (!preview) {
            preview = document.createElement('div');
            preview.className = 'cart-preview';
            preview.id = 'cart-preview';
            const content = document.querySelector('main') || document.body;
            content.insertBefore(preview, content.firstChild);
        }

        preview.innerHTML = `
            <div class="cart-preview-header">
                <strong>Cart (${itemCount} items)</strong>
                <span class="cart-preview-total">$${(total / 100).toFixed(2)}</span>
            </div>
            <div class="cart-preview-items">
                ${items.map(item => `
                    <div class="cart-preview-item">
                        <span class="item-qty">${item.quantity}×</span>
                        <span class="item-name">${item.name}</span>
                        <span class="item-price">$${(item.price_cents / 100).toFixed(2)}</span>
                    </div>
                `).join('')}
            </div>
        `;
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

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

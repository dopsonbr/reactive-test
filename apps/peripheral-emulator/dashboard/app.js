// Dashboard Application
(function() {
  const API_BASE = 'http://localhost:9101';

  // State
  let messageLog = [];
  let demoCart = [];

  // DOM Elements
  const elements = {
    connectionStatus: document.getElementById('connection-status'),
    deviceState: document.getElementById('device-state'),
    paymentState: document.getElementById('payment-state'),
    messageLog: document.getElementById('message-log'),
    cartItems: document.getElementById('cart-items'),
    cartTotal: document.getElementById('cart-total'),
    demoPayBtn: document.getElementById('demo-pay'),
    demoStatus: document.getElementById('demo-status'),
  };

  // Tab Navigation
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(`tab-${btn.dataset.tab}`).classList.add('active');
    });
  });

  // API Helpers
  async function apiPost(endpoint, body = {}) {
    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      return response.json();
    } catch (error) {
      console.error('API Error:', error);
      return { error: error.message };
    }
  }

  async function apiGet(endpoint) {
    try {
      const response = await fetch(`${API_BASE}${endpoint}`);
      return response.json();
    } catch (error) {
      console.error('API Error:', error);
      return { error: error.message };
    }
  }

  // Refresh device state
  async function refreshState() {
    const state = await apiGet('/control/state');
    if (state.error) {
      elements.connectionStatus.className = 'status disconnected';
      elements.connectionStatus.textContent = 'Disconnected';
      elements.deviceState.textContent = 'Unable to connect to emulator';
      return;
    }

    elements.connectionStatus.className = 'status connected';
    elements.connectionStatus.textContent = `Connected (${state.clients} clients)`;
    elements.deviceState.textContent = JSON.stringify(state, null, 2);
    elements.paymentState.textContent = `State: ${state.paymentState || 'idle'}`;
  }

  // Scanner Controls
  document.getElementById('scanner-enable').addEventListener('click', async () => {
    await apiPost('/control/scanner/enable');
    addLogEntry('outgoing', 'Scanner enabled');
    refreshState();
  });

  document.getElementById('scanner-disable').addEventListener('click', async () => {
    await apiPost('/control/scanner/disable');
    addLogEntry('outgoing', 'Scanner disabled');
    refreshState();
  });

  document.getElementById('trigger-scan').addEventListener('click', async () => {
    const barcode = document.getElementById('scan-barcode').value || '0012345678905';
    const symbology = document.getElementById('scan-symbology').value;
    await apiPost('/control/scanner/scan', { barcode, symbology });
    addLogEntry('outgoing', `Triggered scan: ${barcode} (${symbology})`);

    // Add to demo cart
    addToCart(barcode);
  });

  // Payment Controls
  document.getElementById('payment-insert').addEventListener('click', async () => {
    const method = document.getElementById('payment-method').value;
    await apiPost('/control/payment/insert', { method });
    addLogEntry('outgoing', `Card inserted: ${method}`);
    refreshState();
  });

  document.getElementById('payment-approve').addEventListener('click', async () => {
    await apiPost('/control/payment/approve');
    addLogEntry('outgoing', 'Payment force approved');
    refreshState();
  });

  document.getElementById('payment-decline').addEventListener('click', async () => {
    await apiPost('/control/payment/decline', { reason: 'declined_by_dashboard' });
    addLogEntry('outgoing', 'Payment force declined');
    refreshState();
  });

  // Message Log
  function addLogEntry(direction, message) {
    const timestamp = new Date().toLocaleTimeString();
    const entry = { direction, message, timestamp };
    messageLog.push(entry);

    const div = document.createElement('div');
    div.className = `log-entry ${direction}`;
    div.innerHTML = `<span class="timestamp">${timestamp}</span> ${direction === 'incoming' ? '←' : '→'} ${message}`;
    elements.messageLog.appendChild(div);

    if (document.getElementById('auto-scroll').checked) {
      elements.messageLog.scrollTop = elements.messageLog.scrollHeight;
    }
  }

  document.getElementById('clear-log').addEventListener('click', () => {
    messageLog = [];
    elements.messageLog.innerHTML = '';
  });

  // Demo Cart
  const productDB = {
    '0012345678905': { name: 'Organic Apples', price: 4.99 },
    '0123456789012': { name: 'Whole Milk', price: 3.49 },
    '5901234123457': { name: 'Bread Loaf', price: 2.99 },
  };

  function addToCart(barcode) {
    const product = productDB[barcode] || { name: `Product ${barcode}`, price: 9.99 };
    demoCart.push({ ...product, barcode });
    renderCart();
  }

  function renderCart() {
    if (demoCart.length === 0) {
      elements.cartItems.innerHTML = 'No items scanned';
      elements.cartTotal.textContent = 'Total: $0.00';
      elements.demoPayBtn.disabled = true;
      return;
    }

    elements.cartItems.innerHTML = demoCart.map(item => `
      <div class="cart-item">
        <span>${item.name}</span>
        <span>$${item.price.toFixed(2)}</span>
      </div>
    `).join('');

    const total = demoCart.reduce((sum, item) => sum + item.price, 0);
    elements.cartTotal.textContent = `Total: $${total.toFixed(2)}`;
    elements.demoPayBtn.disabled = false;
  }

  // Demo Pay Button
  elements.demoPayBtn.addEventListener('click', async () => {
    const total = demoCart.reduce((sum, item) => sum + item.price, 0);
    elements.demoStatus.className = 'processing';
    elements.demoStatus.textContent = 'Processing payment...';
    elements.demoPayBtn.disabled = true;

    // Simulate payment flow via control API
    await apiPost('/control/payment/insert', { method: 'contactless' });

    // Wait a bit then check result (in real app, would use WebSocket)
    setTimeout(async () => {
      const state = await apiGet('/control/state');
      if (state.paymentState === 'approved') {
        elements.demoStatus.className = 'success';
        elements.demoStatus.textContent = '✓ Payment approved!';
        demoCart = [];
        renderCart();
      } else {
        elements.demoStatus.className = 'error';
        elements.demoStatus.textContent = '✗ Payment declined';
      }
      elements.demoPayBtn.disabled = demoCart.length === 0;
    }, 3000);
  });

  // Initialize
  refreshState();
  setInterval(refreshState, 2000);

  addLogEntry('incoming', 'Dashboard initialized');
})();

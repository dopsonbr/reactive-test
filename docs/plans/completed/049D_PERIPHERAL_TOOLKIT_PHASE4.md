# Peripheral Developer Toolkit - Phase 4: Developer Experience

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build the emulator dashboard, Ladle stories, and documentation to complete the developer experience.

**Architecture:** The dashboard is embedded in the Go binary as static assets. It provides control panel, message log, and an interactive "Try It" demo. Ladle stories demonstrate SDK components in isolation.

**Tech Stack:** Go (embed), HTML/CSS/JS (vanilla), React, Ladle, Markdown

**Parent Plan:** [049_PERIPHERAL_DEVELOPER_TOOLKIT.md](./049_PERIPHERAL_DEVELOPER_TOOLKIT.md)
**Previous Phase:** [049C - Phase 3: Payment Implementation](./049C_PERIPHERAL_TOOLKIT_PHASE3.md)

---

## Task 1: Dashboard Static Assets Structure

**Files:**
- Create: `apps/peripheral-emulator/dashboard/index.html`
- Create: `apps/peripheral-emulator/dashboard/styles.css`
- Create: `apps/peripheral-emulator/dashboard/app.js`
- Modify: `apps/peripheral-emulator/internal/server/server.go`

**Step 1: Create dashboard directory**

```bash
mkdir -p apps/peripheral-emulator/dashboard
```

**Step 2: Create index.html**

Create `apps/peripheral-emulator/dashboard/index.html`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Peripheral Emulator Dashboard</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <header>
    <h1>🔌 Peripheral Emulator</h1>
    <div id="connection-status" class="status disconnected">Disconnected</div>
  </header>

  <nav>
    <button class="tab-btn active" data-tab="control">Control Panel</button>
    <button class="tab-btn" data-tab="messages">Message Log</button>
    <button class="tab-btn" data-tab="tryit">Try It</button>
  </nav>

  <main>
    <!-- Control Panel Tab -->
    <section id="tab-control" class="tab-content active">
      <div class="panel">
        <h2>📊 Device State</h2>
        <div id="device-state">Loading...</div>
      </div>

      <div class="panel">
        <h2>🔍 Scanner</h2>
        <div class="control-row">
          <button id="scanner-enable" class="btn">Enable</button>
          <button id="scanner-disable" class="btn">Disable</button>
        </div>
        <div class="control-row">
          <input type="text" id="scan-barcode" placeholder="Barcode (default: 0012345678905)">
          <select id="scan-symbology">
            <option value="ean13">EAN-13</option>
            <option value="upc-a">UPC-A</option>
            <option value="qr">QR Code</option>
            <option value="pdf417">PDF417</option>
          </select>
          <button id="trigger-scan" class="btn primary">Trigger Scan</button>
        </div>
      </div>

      <div class="panel">
        <h2>💳 Payment</h2>
        <div class="control-row">
          <select id="payment-method">
            <option value="chip">Chip</option>
            <option value="contactless">Contactless</option>
            <option value="swipe">Swipe</option>
          </select>
          <button id="payment-insert" class="btn">Insert Card</button>
        </div>
        <div class="control-row">
          <button id="payment-approve" class="btn success">Force Approve</button>
          <button id="payment-decline" class="btn danger">Force Decline</button>
        </div>
        <div id="payment-state" class="state-indicator">State: idle</div>
      </div>
    </section>

    <!-- Message Log Tab -->
    <section id="tab-messages" class="tab-content">
      <div class="panel">
        <div class="log-controls">
          <button id="clear-log" class="btn">Clear Log</button>
          <label>
            <input type="checkbox" id="auto-scroll" checked> Auto-scroll
          </label>
        </div>
        <div id="message-log" class="log-container"></div>
      </div>
    </section>

    <!-- Try It Tab -->
    <section id="tab-tryit" class="tab-content">
      <div class="panel tryit-panel">
        <h2>🛒 Mini Checkout Demo</h2>
        <p class="instructions">This demo connects to the emulator via WebSocket and demonstrates the SDK flow.</p>

        <div class="demo-layout">
          <div class="demo-ui">
            <div id="demo-cart">
              <h3>Cart</h3>
              <div id="cart-items">No items scanned</div>
              <div id="cart-total">Total: $0.00</div>
            </div>
            <button id="demo-pay" class="btn primary large" disabled>Pay Now</button>
            <div id="demo-status"></div>
          </div>

          <div class="demo-code">
            <h3>SDK Code</h3>
            <pre id="code-display"><code>// Connect to emulator
const client = new PeripheralClient('ws://localhost:9100/stomp');
await client.connect();

// Listen for scans
client.scanner.onScan((event) => {
  console.log('Scanned:', event.barcode);
});

// Collect payment
const result = await client.payment.collect({
  amount: 4750,
  currency: 'USD'
});
</code></pre>
          </div>
        </div>
      </div>
    </section>
  </main>

  <script src="app.js"></script>
</body>
</html>
```

**Step 3: Create styles.css**

Create `apps/peripheral-emulator/dashboard/styles.css`:

```css
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: #1a1a2e;
  color: #eee;
  min-height: 100vh;
}

header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  background: #16213e;
  border-bottom: 1px solid #0f3460;
}

header h1 {
  font-size: 1.5rem;
  font-weight: 600;
}

.status {
  padding: 0.5rem 1rem;
  border-radius: 4px;
  font-size: 0.875rem;
  font-weight: 500;
}

.status.connected {
  background: #10b981;
  color: white;
}

.status.disconnected {
  background: #ef4444;
  color: white;
}

nav {
  display: flex;
  gap: 0;
  background: #16213e;
  padding: 0 2rem;
}

.tab-btn {
  padding: 1rem 1.5rem;
  background: transparent;
  border: none;
  color: #888;
  cursor: pointer;
  font-size: 1rem;
  border-bottom: 2px solid transparent;
  transition: all 0.2s;
}

.tab-btn:hover {
  color: #eee;
}

.tab-btn.active {
  color: #e94560;
  border-bottom-color: #e94560;
}

main {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.tab-content {
  display: none;
}

.tab-content.active {
  display: block;
}

.panel {
  background: #16213e;
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  border: 1px solid #0f3460;
}

.panel h2 {
  font-size: 1.25rem;
  margin-bottom: 1rem;
  color: #e94560;
}

.control-row {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
  flex-wrap: wrap;
}

.btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.875rem;
  background: #0f3460;
  color: #eee;
  transition: background 0.2s;
}

.btn:hover {
  background: #1a4a7a;
}

.btn.primary {
  background: #e94560;
}

.btn.primary:hover {
  background: #ff6b6b;
}

.btn.success {
  background: #10b981;
}

.btn.success:hover {
  background: #34d399;
}

.btn.danger {
  background: #ef4444;
}

.btn.danger:hover {
  background: #f87171;
}

.btn.large {
  padding: 1rem 2rem;
  font-size: 1.125rem;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

input, select {
  padding: 0.5rem;
  border: 1px solid #0f3460;
  border-radius: 4px;
  background: #1a1a2e;
  color: #eee;
  font-size: 0.875rem;
}

input:focus, select:focus {
  outline: none;
  border-color: #e94560;
}

.state-indicator {
  margin-top: 1rem;
  padding: 0.75rem;
  background: #1a1a2e;
  border-radius: 4px;
  font-family: monospace;
}

.log-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.log-controls label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.log-container {
  height: 400px;
  overflow-y: auto;
  background: #0d0d1a;
  border-radius: 4px;
  padding: 1rem;
  font-family: monospace;
  font-size: 0.875rem;
}

.log-entry {
  padding: 0.25rem 0;
  border-bottom: 1px solid #1a1a2e;
}

.log-entry.incoming {
  color: #10b981;
}

.log-entry.outgoing {
  color: #3b82f6;
}

.log-entry .timestamp {
  color: #666;
  margin-right: 0.5rem;
}

/* Try It Tab */
.tryit-panel .instructions {
  color: #888;
  margin-bottom: 1.5rem;
}

.demo-layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
}

@media (max-width: 768px) {
  .demo-layout {
    grid-template-columns: 1fr;
  }
}

.demo-ui {
  background: #1a1a2e;
  padding: 1.5rem;
  border-radius: 8px;
}

.demo-ui h3 {
  margin-bottom: 1rem;
}

#cart-items {
  min-height: 100px;
  margin-bottom: 1rem;
  padding: 1rem;
  background: #0d0d1a;
  border-radius: 4px;
}

.cart-item {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem 0;
  border-bottom: 1px solid #1a1a2e;
}

#cart-total {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 1rem;
  text-align: right;
}

#demo-status {
  margin-top: 1rem;
  padding: 1rem;
  border-radius: 4px;
  text-align: center;
}

#demo-status.success {
  background: #10b98133;
  color: #10b981;
}

#demo-status.error {
  background: #ef444433;
  color: #ef4444;
}

#demo-status.processing {
  background: #3b82f633;
  color: #3b82f6;
}

.demo-code {
  background: #0d0d1a;
  padding: 1rem;
  border-radius: 8px;
}

.demo-code h3 {
  margin-bottom: 1rem;
  color: #888;
}

.demo-code pre {
  overflow-x: auto;
  font-size: 0.8rem;
  line-height: 1.5;
}

.demo-code code {
  color: #a5d6ff;
}

/* Device State */
#device-state {
  font-family: monospace;
  white-space: pre-wrap;
  background: #0d0d1a;
  padding: 1rem;
  border-radius: 4px;
  font-size: 0.875rem;
}
```

**Step 4: Create app.js**

Create `apps/peripheral-emulator/dashboard/app.js`:

```javascript
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
```

**Step 5: Commit**

```bash
git add apps/peripheral-emulator/dashboard
git commit -m "feat(peripheral-emulator): create dashboard static assets"
```

---

## Task 2: Embed Dashboard in Go Binary

**Files:**
- Create: `apps/peripheral-emulator/internal/dashboard/embed.go`
- Modify: `apps/peripheral-emulator/internal/server/server.go`

**Step 1: Create embed file**

Create `apps/peripheral-emulator/internal/dashboard/embed.go`:

```go
package dashboard

import (
	"embed"
	"io/fs"
	"net/http"
)

//go:embed static/*
var staticFiles embed.FS

// Handler returns an http.Handler that serves the embedded dashboard files
func Handler() http.Handler {
	// Strip the "static/" prefix
	subFS, err := fs.Sub(staticFiles, "static")
	if err != nil {
		panic(err)
	}
	return http.FileServer(http.FS(subFS))
}
```

**Step 2: Copy dashboard files to embed location**

```bash
mkdir -p apps/peripheral-emulator/internal/dashboard/static
cp apps/peripheral-emulator/dashboard/* apps/peripheral-emulator/internal/dashboard/static/
```

**Step 3: Update server to serve dashboard**

Modify `apps/peripheral-emulator/internal/server/server.go`:

Add import:
```go
import (
	// ... existing imports
	"github.com/reactive-platform/peripheral-emulator/internal/dashboard"
)
```

Update Start function:
```go
func (s *Server) Start() error {
	// ... existing WebSocket setup

	// HTTP control server
	httpMux := http.NewServeMux()

	// Dashboard (serve at root)
	httpMux.Handle("/", dashboard.Handler())

	// Control endpoints
	httpMux.HandleFunc("/control/state", s.handleState)
	httpMux.HandleFunc("/control/scanner/scan", s.handleTriggerScan)
	httpMux.HandleFunc("/control/scanner/enable", s.handleScannerEnable)
	httpMux.HandleFunc("/control/scanner/disable", s.handleScannerDisable)
	httpMux.HandleFunc("/control/payment/insert", s.handlePaymentInsert)
	httpMux.HandleFunc("/control/payment/approve", s.handlePaymentApprove)
	httpMux.HandleFunc("/control/payment/decline", s.handlePaymentDecline)
	httpMux.HandleFunc("/health", s.handleHealth)

	// ... rest of Start()
}
```

Update main.go to show dashboard URL:
```go
func main() {
	// ... existing flag parsing

	log.Printf("Starting Peripheral Emulator")
	log.Printf("  Device ID: %s", *deviceID)
	log.Printf("  WebSocket: ws://localhost:%d/stomp", *wsPort)
	log.Printf("  Dashboard: http://localhost:%d", *httpPort)

	// ... rest of main
}
```

**Step 4: Verify dashboard works**

```bash
pnpm nx build peripheral-emulator
pnpm nx serve peripheral-emulator
```

Open browser to http://localhost:9101

Expected: Dashboard loads with all three tabs functional

**Step 5: Commit**

```bash
git add apps/peripheral-emulator/internal/dashboard
git add apps/peripheral-emulator/internal/server/server.go
git add apps/peripheral-emulator/main.go
git commit -m "feat(peripheral-emulator): embed dashboard in Go binary"
```

---

## Task 3: Ladle Stories for React SDK

**Files:**
- Create: `libs/frontend/peripheral-sdk/react/.ladle/config.mjs`
- Create: `libs/frontend/peripheral-sdk/react/src/stories/CapabilityDisplay.stories.tsx`
- Create: `libs/frontend/peripheral-sdk/react/src/stories/ScannerDemo.stories.tsx`
- Create: `libs/frontend/peripheral-sdk/react/src/stories/PaymentFlow.stories.tsx`

**Step 1: Create Ladle config**

Create `libs/frontend/peripheral-sdk/react/.ladle/config.mjs`:

```javascript
/** @type {import('@ladle/react').UserConfig} */
export default {
  stories: 'src/**/*.stories.{ts,tsx}',
  addons: {
    a11y: {
      enabled: true,
    },
  },
};
```

**Step 2: Create CapabilityDisplay story**

Create `libs/frontend/peripheral-sdk/react/src/stories/CapabilityDisplay.stories.tsx`:

```tsx
import type { Story } from '@ladle/react';
import { usePeripherals, PeripheralProvider } from '../context';

function CapabilityDisplayInner() {
  const { connected, capabilities } = usePeripherals();

  return (
    <div style={{ fontFamily: 'system-ui', padding: '1rem' }}>
      <h2>Device Capabilities</h2>

      <div style={{ marginBottom: '1rem' }}>
        <strong>Connection:</strong>{' '}
        <span style={{ color: connected ? 'green' : 'red' }}>
          {connected ? '● Connected' : '○ Disconnected'}
        </span>
      </div>

      <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        <div style={{ padding: '1rem', background: '#f5f5f5', borderRadius: '8px' }}>
          <h3>🔍 Scanner</h3>
          <p>Available: {capabilities.scanner?.available ? '✓' : '✗'}</p>
          {capabilities.scanner?.symbologies && (
            <p>Symbologies: {capabilities.scanner.symbologies.join(', ')}</p>
          )}
        </div>

        <div style={{ padding: '1rem', background: '#f5f5f5', borderRadius: '8px' }}>
          <h3>💳 Payment</h3>
          <p>Available: {capabilities.payment?.available ? '✓' : '✗'}</p>
          {capabilities.payment?.methods && (
            <p>Methods: {capabilities.payment.methods.join(', ')}</p>
          )}
        </div>
      </div>
    </div>
  );
}

function MockProvider({ children }: { children: React.ReactNode }) {
  // In stories, we mock the provider behavior
  return (
    <div style={{ border: '2px dashed #ccc', padding: '1rem', borderRadius: '8px' }}>
      <div style={{ marginBottom: '1rem', color: '#666', fontSize: '0.875rem' }}>
        ⚠️ Mock mode - Start emulator for real connection
      </div>
      {children}
    </div>
  );
}

export const Default: Story = () => (
  <MockProvider>
    <div style={{ fontFamily: 'system-ui', padding: '1rem' }}>
      <h2>Device Capabilities</h2>

      <div style={{ marginBottom: '1rem' }}>
        <strong>Connection:</strong>{' '}
        <span style={{ color: 'orange' }}>○ Mock Mode</span>
      </div>

      <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        <div style={{ padding: '1rem', background: '#f5f5f5', borderRadius: '8px' }}>
          <h3>🔍 Scanner</h3>
          <p>Available: ✓</p>
          <p>Symbologies: ean13, upc-a, qr, pdf417</p>
        </div>

        <div style={{ padding: '1rem', background: '#f5f5f5', borderRadius: '8px' }}>
          <h3>💳 Payment</h3>
          <p>Available: ✓</p>
          <p>Methods: chip, contactless, swipe</p>
        </div>
      </div>
    </div>
  </MockProvider>
);
Default.storyName = 'Capability Display';
```

**Step 3: Create ScannerDemo story**

Create `libs/frontend/peripheral-sdk/react/src/stories/ScannerDemo.stories.tsx`:

```tsx
import type { Story } from '@ladle/react';
import { useState } from 'react';

interface MockScanEvent {
  barcode: string;
  symbology: string;
  timestamp: string;
}

function ScannerDemoInner() {
  const [enabled, setEnabled] = useState(false);
  const [scans, setScans] = useState<MockScanEvent[]>([]);

  const handleTriggerScan = () => {
    if (!enabled) return;
    const event: MockScanEvent = {
      barcode: `${Math.floor(Math.random() * 9000000000000) + 1000000000000}`,
      symbology: 'ean13',
      timestamp: new Date().toISOString(),
    };
    setScans((prev) => [event, ...prev].slice(0, 10));
  };

  return (
    <div style={{ fontFamily: 'system-ui', padding: '1rem', maxWidth: '500px' }}>
      <h2>🔍 Scanner Demo</h2>

      <div style={{ marginBottom: '1rem' }}>
        <button
          onClick={() => setEnabled(!enabled)}
          style={{
            padding: '0.5rem 1rem',
            marginRight: '0.5rem',
            background: enabled ? '#ef4444' : '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          {enabled ? 'Disable' : 'Enable'} Scanner
        </button>

        <button
          onClick={handleTriggerScan}
          disabled={!enabled}
          style={{
            padding: '0.5rem 1rem',
            background: enabled ? '#3b82f6' : '#ccc',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: enabled ? 'pointer' : 'not-allowed',
          }}
        >
          Simulate Scan
        </button>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        Status:{' '}
        <span style={{ color: enabled ? 'green' : 'gray' }}>
          {enabled ? '● Enabled' : '○ Disabled'}
        </span>
      </div>

      <div>
        <h3>Recent Scans</h3>
        {scans.length === 0 ? (
          <p style={{ color: '#666' }}>No scans yet. Enable scanner and click "Simulate Scan".</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {scans.map((scan, i) => (
              <li
                key={i}
                style={{
                  padding: '0.5rem',
                  marginBottom: '0.5rem',
                  background: '#f5f5f5',
                  borderRadius: '4px',
                  fontFamily: 'monospace',
                }}
              >
                {scan.barcode} ({scan.symbology})
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export const Default: Story = () => <ScannerDemoInner />;
Default.storyName = 'Scanner Demo';

export const WithPreloadedScans: Story = () => {
  const preloadedScans: MockScanEvent[] = [
    { barcode: '0012345678905', symbology: 'ean13', timestamp: new Date().toISOString() },
    { barcode: '5901234123457', symbology: 'ean13', timestamp: new Date().toISOString() },
  ];

  return (
    <div style={{ fontFamily: 'system-ui', padding: '1rem', maxWidth: '500px' }}>
      <h2>🔍 Scanner Demo (Preloaded)</h2>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {preloadedScans.map((scan, i) => (
          <li
            key={i}
            style={{
              padding: '0.5rem',
              marginBottom: '0.5rem',
              background: '#f5f5f5',
              borderRadius: '4px',
              fontFamily: 'monospace',
            }}
          >
            {scan.barcode} ({scan.symbology})
          </li>
        ))}
      </ul>
    </div>
  );
};
```

**Step 4: Create PaymentFlow story**

Create `libs/frontend/peripheral-sdk/react/src/stories/PaymentFlow.stories.tsx`:

```tsx
import type { Story } from '@ladle/react';
import { useState } from 'react';

type PaymentState =
  | 'idle'
  | 'card_presented'
  | 'reading_card'
  | 'pin_required'
  | 'pin_entry'
  | 'authorizing'
  | 'approved'
  | 'declined';

const stateLabels: Record<PaymentState, string> = {
  idle: 'Ready for payment',
  card_presented: 'Card detected...',
  reading_card: 'Reading card...',
  pin_required: 'Enter PIN on terminal',
  pin_entry: 'PIN being entered...',
  authorizing: 'Authorizing payment...',
  approved: '✓ Payment Approved!',
  declined: '✗ Payment Declined',
};

const stateColors: Record<PaymentState, string> = {
  idle: '#666',
  card_presented: '#3b82f6',
  reading_card: '#3b82f6',
  pin_required: '#f59e0b',
  pin_entry: '#f59e0b',
  authorizing: '#8b5cf6',
  approved: '#10b981',
  declined: '#ef4444',
};

function PaymentFlowInner() {
  const [state, setState] = useState<PaymentState>('idle');
  const [amount] = useState(4750);

  const simulatePayment = async () => {
    const states: PaymentState[] = [
      'card_presented',
      'reading_card',
      'pin_required',
      'pin_entry',
      'authorizing',
      'approved',
    ];

    for (const s of states) {
      setState(s);
      await new Promise((r) => setTimeout(r, 1000));
    }

    setTimeout(() => setState('idle'), 3000);
  };

  const simulateDecline = async () => {
    const states: PaymentState[] = [
      'card_presented',
      'reading_card',
      'authorizing',
      'declined',
    ];

    for (const s of states) {
      setState(s);
      await new Promise((r) => setTimeout(r, 800));
    }

    setTimeout(() => setState('idle'), 3000);
  };

  return (
    <div style={{ fontFamily: 'system-ui', padding: '1rem', maxWidth: '400px' }}>
      <h2>💳 Payment Flow Demo</h2>

      <div
        style={{
          padding: '2rem',
          background: '#f5f5f5',
          borderRadius: '8px',
          textAlign: 'center',
          marginBottom: '1rem',
        }}
      >
        <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
          ${(amount / 100).toFixed(2)}
        </div>
        <div
          style={{
            color: stateColors[state],
            fontSize: '1.25rem',
            fontWeight: 500,
          }}
        >
          {stateLabels[state]}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button
          onClick={simulatePayment}
          disabled={state !== 'idle'}
          style={{
            flex: 1,
            padding: '0.75rem',
            background: state === 'idle' ? '#10b981' : '#ccc',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: state === 'idle' ? 'pointer' : 'not-allowed',
          }}
        >
          Simulate Approval
        </button>
        <button
          onClick={simulateDecline}
          disabled={state !== 'idle'}
          style={{
            flex: 1,
            padding: '0.75rem',
            background: state === 'idle' ? '#ef4444' : '#ccc',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: state === 'idle' ? 'pointer' : 'not-allowed',
          }}
        >
          Simulate Decline
        </button>
      </div>
    </div>
  );
}

export const Default: Story = () => <PaymentFlowInner />;
Default.storyName = 'Payment Flow';

export const AllStates: Story = () => {
  const states: PaymentState[] = [
    'idle',
    'card_presented',
    'reading_card',
    'pin_required',
    'pin_entry',
    'authorizing',
    'approved',
    'declined',
  ];

  return (
    <div style={{ fontFamily: 'system-ui', padding: '1rem' }}>
      <h2>Payment States Reference</h2>
      <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        {states.map((state) => (
          <div
            key={state}
            style={{
              padding: '1rem',
              background: '#f5f5f5',
              borderRadius: '8px',
              borderLeft: `4px solid ${stateColors[state]}`,
            }}
          >
            <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{state}</div>
            <div style={{ color: stateColors[state] }}>{stateLabels[state]}</div>
          </div>
        ))}
      </div>
    </div>
  );
};
AllStates.storyName = 'All Payment States';
```

**Step 5: Verify Ladle runs**

```bash
pnpm nx ladle peripheral-react
```

Expected: Ladle opens with all stories visible and interactive

**Step 6: Commit**

```bash
git add libs/frontend/peripheral-sdk/react/.ladle
git add libs/frontend/peripheral-sdk/react/src/stories
git commit -m "feat(peripheral-react): add Ladle stories for SDK components"
```

---

## Task 4: API Reference Documentation

**Files:**
- Create: `docs/peripheral-sdk/api-reference.md`

**Step 1: Create API reference**

Create `docs/peripheral-sdk/api-reference.md`:

```markdown
# Peripheral SDK API Reference

## Core Library (`@reactive-platform/peripheral-core`)

### PeripheralClient

Main entry point for connecting to the peripheral bridge.

```typescript
import { PeripheralClient } from '@reactive-platform/peripheral-core';

const client = new PeripheralClient(endpoint, options?);
```

#### Constructor

| Parameter | Type | Description |
|-----------|------|-------------|
| `endpoint` | `string` | WebSocket URL (e.g., `ws://localhost:9100/stomp`) |
| `options` | `PeripheralClientOptions` | Optional configuration |

#### Options

```typescript
interface PeripheralClientOptions {
  reconnectDelay?: number;    // Default: 5000ms
  heartbeatIncoming?: number; // Default: 10000ms
  heartbeatOutgoing?: number; // Default: 10000ms
  debug?: boolean;            // Default: false
  autoReconnect?: boolean;    // Default: true
}
```

#### Properties

| Property | Type | Description |
|----------|------|-------------|
| `capabilities` | `Capabilities` | Current device capabilities |
| `connected` | `boolean` | Connection status |
| `scanner` | `ScannerService` | Scanner operations |
| `payment` | `PaymentService` | Payment operations |

#### Methods

| Method | Returns | Description |
|--------|---------|-------------|
| `connect()` | `Promise<void>` | Connect to the bridge |
| `disconnect()` | `Promise<void>` | Disconnect from the bridge |
| `onCapabilities(handler)` | `Unsubscribe` | Subscribe to capability changes |
| `onConnectionChange(handler)` | `Unsubscribe` | Subscribe to connection changes |

---

### ScannerService

Scanner operations via `client.scanner`.

#### Properties

| Property | Type | Description |
|----------|------|-------------|
| `enabled` | `boolean` | Whether scanner is enabled |

#### Methods

| Method | Returns | Description |
|--------|---------|-------------|
| `enable()` | `Promise<void>` | Enable the scanner |
| `disable()` | `Promise<void>` | Disable the scanner |
| `onScan(handler)` | `Unsubscribe` | Subscribe to scan events |

#### ScanEvent

```typescript
interface ScanEvent {
  barcode: string;
  symbology: BarcodeSymbology;
  timestamp: string;
}

type BarcodeSymbology =
  | 'ean13' | 'ean8' | 'upc-a' | 'upc-e'
  | 'qr' | 'pdf417' | 'code128' | 'code39' | 'datamatrix';
```

---

### PaymentService

Payment operations via `client.payment`.

#### Properties

| Property | Type | Description |
|----------|------|-------------|
| `state` | `PaymentState` | Current payment state |

#### Methods

| Method | Returns | Description |
|--------|---------|-------------|
| `collect(request)` | `Promise<PaymentResult>` | Start payment collection |
| `cancel()` | `Promise<void>` | Cancel current payment |
| `onStateChange(handler)` | `Unsubscribe` | Subscribe to state changes |

#### PaymentRequest

```typescript
interface PaymentRequest {
  amount: number;        // Amount in cents
  currency: string;      // e.g., 'USD'
  allowCashback?: boolean;
  timeout?: number;      // Milliseconds
}
```

#### PaymentResult

```typescript
interface PaymentResult {
  approved: boolean;
  transactionId?: string;
  method?: 'chip' | 'contactless' | 'swipe';
  cardBrand?: string;
  last4?: string;
  authCode?: string;
  declineReason?: string;
  error?: string;
}
```

#### PaymentState

```typescript
type PaymentState =
  | 'idle'
  | 'card_presented'
  | 'reading_card'
  | 'pin_required'
  | 'pin_entry'
  | 'authorizing'
  | 'approved'
  | 'declined'
  | 'cancelled'
  | 'error';
```

---

## React Library (`@reactive-platform/peripheral-react`)

### PeripheralProvider

Context provider for React applications.

```tsx
import { PeripheralProvider } from '@reactive-platform/peripheral-react';

<PeripheralProvider endpoint="ws://localhost:9100/stomp">
  <App />
</PeripheralProvider>
```

#### Props

| Prop | Type | Description |
|------|------|-------------|
| `endpoint` | `string` | WebSocket URL |
| `options` | `PeripheralClientOptions` | Optional configuration |
| `children` | `ReactNode` | Child components |

---

### usePeripherals

Hook for accessing peripheral state.

```typescript
const { connected, capabilities, scanner, client } = usePeripherals();
```

#### Returns

| Property | Type | Description |
|----------|------|-------------|
| `connected` | `boolean` | Connection status |
| `capabilities` | `Capabilities` | Device capabilities |
| `scanner` | `ScannerService \| null` | Scanner service |
| `client` | `PeripheralClient \| null` | Underlying client |

---

### useScanner

Hook for scanner operations.

```typescript
const { enable, disable, enabled, lastScan, available } = useScanner();
```

#### Returns

| Property | Type | Description |
|----------|------|-------------|
| `enable` | `() => Promise<void>` | Enable scanner |
| `disable` | `() => Promise<void>` | Disable scanner |
| `enabled` | `boolean` | Whether enabled |
| `lastScan` | `ScanEvent \| null` | Most recent scan |
| `available` | `boolean` | Capability available |

---

### usePayment

Hook for payment operations.

```typescript
const { collect, cancel, state, result, available, methods } = usePayment();
```

#### Returns

| Property | Type | Description |
|----------|------|-------------|
| `collect` | `(request: PaymentRequest) => Promise<PaymentResult>` | Start payment |
| `cancel` | `() => Promise<void>` | Cancel payment |
| `state` | `PaymentState` | Current state |
| `result` | `PaymentResult \| null` | Last result |
| `available` | `boolean` | Capability available |
| `methods` | `string[]` | Available payment methods |

---

## STOMP Protocol Reference

### Destinations

| Destination | Direction | Purpose |
|-------------|-----------|---------|
| `/topic/capabilities` | Bridge → Client | Capability updates |
| `/topic/scanner/events` | Bridge → Client | Scan events |
| `/topic/payment/events` | Bridge → Client | Payment state/result events |
| `/app/scanner/enable` | Client → Bridge | Enable scanner |
| `/app/scanner/disable` | Client → Bridge | Disable scanner |
| `/app/payment/collect` | Client → Bridge | Start payment |
| `/app/payment/cancel` | Client → Bridge | Cancel payment |

### Message Formats

#### Capabilities Message

```json
{
  "type": "capabilities",
  "timestamp": "2025-12-10T10:30:00Z",
  "deviceId": "emulator-001",
  "capabilities": {
    "scanner": {
      "available": true,
      "mode": "bridge",
      "symbologies": ["ean13", "upc-a", "qr", "pdf417"]
    },
    "payment": {
      "available": true,
      "methods": ["chip", "contactless", "swipe"],
      "cashback": true
    }
  }
}
```

#### Scan Event Message

```json
{
  "type": "scan",
  "event": {
    "barcode": "0012345678905",
    "symbology": "ean13",
    "timestamp": "2025-12-10T10:31:00Z"
  }
}
```

#### Payment State Event

```json
{
  "type": "state_change",
  "state": "authorizing"
}
```

#### Payment Result Event

```json
{
  "type": "result",
  "result": {
    "approved": true,
    "transactionId": "txn-123456",
    "method": "chip",
    "cardBrand": "visa",
    "last4": "4242",
    "authCode": "ABC123"
  }
}
```
```

**Step 2: Commit**

```bash
mkdir -p docs/peripheral-sdk
git add docs/peripheral-sdk/api-reference.md
git commit -m "docs(peripheral-sdk): add API reference documentation"
```

---

## Task 5: Getting Started Guide

**Files:**
- Create: `docs/peripheral-sdk/getting-started.md`

**Step 1: Create getting started guide**

Create `docs/peripheral-sdk/getting-started.md`:

```markdown
# Peripheral SDK Getting Started Guide

This guide walks you through setting up and using the Peripheral SDK for building POS, self-checkout, and kiosk applications.

## Prerequisites

- Node.js 18+
- pnpm package manager
- Go 1.22+ (for running the emulator)

## Quick Start

### 1. Start the Emulator

The emulator simulates hardware peripherals (scanner, payment terminal) for development.

```bash
# Build and run the emulator
pnpm nx serve peripheral-emulator
```

You'll see:
```
Starting Peripheral Emulator
  Device ID: emulator-001
  WebSocket: ws://localhost:9100/stomp
  Dashboard: http://localhost:9101
```

Open **http://localhost:9101** to access the dashboard.

### 2. Install the SDK

```bash
# Core library (required)
pnpm add @reactive-platform/peripheral-core

# React bindings (for React apps)
pnpm add @reactive-platform/peripheral-react

# Test mocks (for testing)
pnpm add -D @reactive-platform/peripheral-mocks
```

### 3. Connect to the Emulator

#### React Application

```tsx
// App.tsx
import { PeripheralProvider } from '@reactive-platform/peripheral-react';
import { CheckoutFlow } from './CheckoutFlow';

export function App() {
  return (
    <PeripheralProvider endpoint="ws://localhost:9100/stomp">
      <CheckoutFlow />
    </PeripheralProvider>
  );
}
```

#### Vanilla JavaScript

```javascript
import { PeripheralClient } from '@reactive-platform/peripheral-core';

const client = new PeripheralClient('ws://localhost:9100/stomp');
await client.connect();

console.log('Connected! Capabilities:', client.capabilities);
```

## Working with the Scanner

### React Hook

```tsx
import { useScanner } from '@reactive-platform/peripheral-react';

function ScannerPanel() {
  const { enable, disable, enabled, lastScan, available } = useScanner();

  if (!available) {
    return <p>Scanner not available</p>;
  }

  return (
    <div>
      <button onClick={enable} disabled={enabled}>Enable</button>
      <button onClick={disable} disabled={!enabled}>Disable</button>

      {lastScan && (
        <p>Last scan: {lastScan.barcode} ({lastScan.symbology})</p>
      )}
    </div>
  );
}
```

### Core Library

```javascript
// Enable scanner
await client.scanner.enable();

// Listen for scans
client.scanner.onScan((event) => {
  console.log('Scanned:', event.barcode, event.symbology);
});

// Disable when done
await client.scanner.disable();
```

### Testing with Dashboard

1. Open http://localhost:9101
2. Go to **Control Panel** tab
3. Click **Enable** under Scanner
4. Enter a barcode and click **Trigger Scan**
5. Your app should receive the scan event

## Working with Payments

### React Hook

```tsx
import { usePayment } from '@reactive-platform/peripheral-react';

function PaymentPanel({ amount }: { amount: number }) {
  const { collect, cancel, state, result, available } = usePayment();

  const handlePay = async () => {
    const result = await collect({
      amount,
      currency: 'USD',
    });

    if (result.approved) {
      console.log('Payment approved:', result.transactionId);
    } else {
      console.log('Payment declined:', result.declineReason);
    }
  };

  if (!available) {
    return <p>Payment terminal not available</p>;
  }

  return (
    <div>
      <p>State: {state}</p>
      <button onClick={handlePay} disabled={state !== 'idle'}>
        Pay ${(amount / 100).toFixed(2)}
      </button>
      {state !== 'idle' && (
        <button onClick={cancel}>Cancel</button>
      )}
    </div>
  );
}
```

### Handling Payment States

The payment flow goes through several states:

| State | Description | UI Recommendation |
|-------|-------------|-------------------|
| `idle` | Ready for payment | Show "Pay" button |
| `card_presented` | Card detected | Show "Card detected..." |
| `reading_card` | Reading card data | Show spinner |
| `pin_required` | PIN needed | Show "Enter PIN on terminal" |
| `pin_entry` | User entering PIN | Show "Entering PIN..." |
| `authorizing` | Waiting for auth | Show spinner |
| `approved` | Payment successful | Show success message |
| `declined` | Payment failed | Show error with retry |

```tsx
function PaymentStatus({ state }: { state: PaymentState }) {
  const messages: Record<PaymentState, string> = {
    idle: 'Ready to pay',
    card_presented: 'Card detected...',
    reading_card: 'Reading card...',
    pin_required: 'Enter PIN on terminal',
    pin_entry: 'Entering PIN...',
    authorizing: 'Authorizing...',
    approved: '✓ Payment approved!',
    declined: '✗ Payment declined',
    cancelled: 'Payment cancelled',
    error: 'An error occurred',
  };

  return <div className={`payment-status ${state}`}>{messages[state]}</div>;
}
```

### Testing with Dashboard

1. In your app, click "Pay" to start a payment
2. Open dashboard **Control Panel**
3. Click **Insert Card** (choose chip/contactless/swipe)
4. Watch the state transitions in your app
5. Click **Force Approve** or **Force Decline** to complete

## Testing with MSW Mocks

For component tests and Playwright e2e tests, use the mock utilities:

```typescript
import {
  triggerScan,
  forcePaymentApprove,
  forcePaymentDecline
} from '@reactive-platform/peripheral-mocks';

// In your test
test('adds scanned item to cart', async () => {
  render(<CheckoutFlow />);

  // Trigger a mock scan
  triggerScan({ barcode: '0012345678905', symbology: 'ean13' });

  // Verify item appears
  await screen.findByText('Organic Apples');
});

test('handles payment approval', async () => {
  render(<CheckoutFlow />);

  // Click pay button
  await userEvent.click(screen.getByRole('button', { name: /pay/i }));

  // Force approval
  forcePaymentApprove({ transactionId: 'test-txn-123' });

  // Verify success message
  await screen.findByText(/payment approved/i);
});

test('handles payment decline', async () => {
  render(<CheckoutFlow />);

  await userEvent.click(screen.getByRole('button', { name: /pay/i }));

  forcePaymentDecline({ reason: 'insufficient_funds' });

  await screen.findByText(/payment declined/i);
});
```

## Detecting Capabilities

Check what's available before showing features:

```tsx
function PaymentOptions() {
  const { capabilities } = usePeripherals();

  const hasCard = capabilities.payment?.available;
  const hasCash = capabilities.cash?.available;

  if (!hasCard && !hasCash) {
    return <DirectToAttendedRegister />;
  }

  return (
    <div>
      {hasCard && <CardPaymentButton />}
      {hasCash && <CashPaymentButton />}
      {!hasCash && hasCard && (
        <p className="notice">Cash not available at this kiosk</p>
      )}
    </div>
  );
}
```

## Troubleshooting

### "Connection refused"

Make sure the emulator is running:
```bash
pnpm nx serve peripheral-emulator
```

### Scanner not receiving events

1. Check the dashboard - is scanner enabled?
2. Verify you're subscribed: `client.scanner.onScan(handler)`
3. Check browser console for STOMP errors

### Payment stuck in state

Use dashboard to force completion:
- **Force Approve** - Immediately approve
- **Force Decline** - Immediately decline

Or call `client.payment.cancel()` from your app.

## Next Steps

- Browse the [API Reference](./api-reference.md)
- View [Ladle Stories](http://localhost:61000) for component examples
- Check the [Dashboard](http://localhost:9101) for interactive testing
```

**Step 2: Commit**

```bash
git add docs/peripheral-sdk/getting-started.md
git commit -m "docs(peripheral-sdk): add getting started guide"
```

---

## Phase 4 Complete

**What was built:**
- Emulator dashboard with Control Panel, Message Log, and Try It demo
- Dashboard embedded in Go binary for single-file distribution
- Ladle stories for CapabilityDisplay, ScannerDemo, and PaymentFlow
- API reference documentation
- Getting started guide

---

## Implementation Complete

All four phases are now complete:

| Phase | Components |
|-------|------------|
| **Phase 1** | Protocol types, SDK Core scaffold, STOMP client, PeripheralClient, Go emulator skeleton |
| **Phase 2** | Scanner state machine, ScannerService, useScanner hook, MSW scanner mocks |
| **Phase 3** | Payment state machine, PaymentService, usePayment hook, MSW payment mocks |
| **Phase 4** | Dashboard UI, Ladle stories, API docs, Getting started guide |

### Final Verification

```bash
# Build everything
pnpm nx run-many -t build --projects=peripheral-core,peripheral-react,peripheral-mocks,peripheral-emulator

# Run all tests
pnpm nx run-many -t test --projects=peripheral-core,peripheral-react,peripheral-mocks

# Start emulator and verify dashboard
pnpm nx serve peripheral-emulator
# Open http://localhost:9101

# View Ladle stories
pnpm nx ladle peripheral-react
```

### Ready for Integration

The toolkit is now ready for use by:
- **POS application** - Full React integration
- **Self-checkout kiosk** - Full React integration
- **Offline POS** - Core library (vanilla JS)

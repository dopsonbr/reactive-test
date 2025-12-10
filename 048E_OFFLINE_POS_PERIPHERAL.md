# 048E_OFFLINE_POS_PERIPHERAL

**Status: DRAFT**

---

## Overview

Implement the JavaScript WebSocket client for communicating with the peripheral bridge (scanner, payment terminal, receipt printer). Uses STOMP protocol over WebSocket as defined in the peripheral integration design.

**Related Plans:**
- 048_OFFLINE_POS - Parent plan
- 048A_OFFLINE_POS_GO_INFRASTRUCTURE - Prerequisite
- 048D_OFFLINE_POS_UI - Prerequisite (provides HTML pages that use this)

## Goals

1. WebSocket connection to peripheral bridge (:9100)
2. STOMP protocol framing for messages
3. Scanner event handling (barcode scans)
4. Payment collection and result handling
5. Receipt printing

## References

**Design:**
- `docs/ideas/2025-12-07-peripheral-integration-design.md` - Full protocol spec
- `docs/ideas/2025-12-09-offline-pos-design.md` - Payment flow section

---

## Phase 1: STOMP Client

**Prereqs:** 048A, 048D complete
**Blockers:** Peripheral bridge must be running (or mocked)

### 1.1 STOMP Frame Parser

**Files:**
- CREATE: `apps/offline-pos/static/js/stomp.js`

**Implementation:**

```javascript
// stomp.js - Minimal STOMP 1.2 client for peripheral bridge

export class StompClient {
    constructor(url) {
        this.url = url;
        this.ws = null;
        this.connected = false;
        this.subscriptions = new Map();
        this.receiptCallbacks = new Map();
        this.messageId = 0;
    }

    connect() {
        return new Promise((resolve, reject) => {
            this.ws = new WebSocket(this.url);

            this.ws.onopen = () => {
                this.send('CONNECT', {
                    'accept-version': '1.2',
                    'host': 'localhost'
                });
            };

            this.ws.onmessage = (event) => {
                const frame = this.parseFrame(event.data);
                this.handleFrame(frame, resolve, reject);
            };

            this.ws.onerror = (err) => reject(err);
            this.ws.onclose = () => {
                this.connected = false;
                console.log('Peripheral bridge disconnected');
            };
        });
    }

    send(command, headers = {}, body = '') {
        const lines = [command];
        for (const [key, value] of Object.entries(headers)) {
            lines.push(`${key}:${value}`);
        }
        lines.push('');
        lines.push(body);
        lines.push('\x00');
        this.ws.send(lines.join('\n'));
    }

    subscribe(destination, callback) {
        const id = `sub-${this.messageId++}`;
        this.subscriptions.set(destination, { id, callback });
        this.send('SUBSCRIBE', {
            id,
            destination
        });
        return id;
    }

    sendMessage(destination, body, receipt = null) {
        const headers = {
            destination,
            'content-type': 'application/json'
        };
        if (receipt) {
            headers.receipt = receipt;
            return new Promise((resolve) => {
                this.receiptCallbacks.set(receipt, resolve);
                this.send('SEND', headers, JSON.stringify(body));
            });
        }
        this.send('SEND', headers, JSON.stringify(body));
    }

    parseFrame(data) {
        const lines = data.split('\n');
        const command = lines[0];
        const headers = {};
        let i = 1;
        while (lines[i] && lines[i] !== '') {
            const [key, ...rest] = lines[i].split(':');
            headers[key] = rest.join(':');
            i++;
        }
        const body = lines.slice(i + 1).join('\n').replace(/\x00$/, '');
        return { command, headers, body };
    }

    handleFrame(frame, resolve, reject) {
        switch (frame.command) {
            case 'CONNECTED':
                this.connected = true;
                console.log('Connected to peripheral bridge');
                resolve();
                break;

            case 'MESSAGE':
                const dest = frame.headers.destination;
                for (const [pattern, sub] of this.subscriptions) {
                    if (dest.startsWith(pattern) || dest === pattern) {
                        const data = frame.body ? JSON.parse(frame.body) : {};
                        sub.callback(data, frame.headers);
                    }
                }
                break;

            case 'RECEIPT':
                const receiptId = frame.headers['receipt-id'];
                if (this.receiptCallbacks.has(receiptId)) {
                    this.receiptCallbacks.get(receiptId)();
                    this.receiptCallbacks.delete(receiptId);
                }
                break;

            case 'ERROR':
                console.error('STOMP error:', frame.body);
                reject(new Error(frame.body));
                break;
        }
    }
}
```

---

## Phase 2: Peripheral Client

**Prereqs:** Phase 1 complete
**Blockers:** None

### 2.1 Peripheral Module

**Files:**
- CREATE: `apps/offline-pos/static/js/peripheral.js`

**Implementation:**

```javascript
// peripheral.js - High-level peripheral bridge client

import { StompClient } from './stomp.js';

let client = null;
let capabilities = null;
let scanCallback = null;
let paymentCallback = null;

export async function connectPeripherals(url) {
    client = new StompClient(url);

    try {
        await client.connect();

        // Subscribe to capability updates
        client.subscribe('/topic/capabilities', (data) => {
            capabilities = data.capabilities;
            console.log('Capabilities updated:', capabilities);
        });

        // Subscribe to scanner events
        client.subscribe('/topic/scanner/events', (data) => {
            if (data.event === 'scan' && scanCallback) {
                scanCallback(data.barcode, data.symbology);
            }
        });

        // Subscribe to payment events
        client.subscribe('/topic/payment/events', (data) => {
            if (paymentCallback) {
                paymentCallback(data);
            }
        });

        return true;
    } catch (err) {
        console.error('Failed to connect to peripheral bridge:', err);
        return false;
    }
}

export function getCapabilities() {
    return capabilities;
}

export function isConnected() {
    return client?.connected ?? false;
}

// Scanner
export function onScan(callback) {
    scanCallback = callback;
}

export function enableScanner() {
    if (!client?.connected) return;
    client.sendMessage('/app/scanner/enable', {});
}

export function disableScanner() {
    if (!client?.connected) return;
    client.sendMessage('/app/scanner/disable', {});
}

// Payment
export function onPaymentResult(callback) {
    paymentCallback = callback;
}

export function collectPayment(amountCents, options = {}) {
    if (!client?.connected) {
        paymentCallback?.({ status: 'error', reason: 'Bridge not connected' });
        return;
    }

    client.sendMessage('/app/payment/collect', {
        amount: amountCents,
        currency: 'USD',
        allowCashback: options.allowCashback ?? false,
        offlineFloorLimit: options.floorLimit ?? 200000, // $2000 default
        timeout: options.timeout ?? 60000
    });
}

export function cancelPayment() {
    if (!client?.connected) return;
    client.sendMessage('/app/payment/cancel', {});
}

// Receipt Printer
export function printReceipt(receipt) {
    if (!client?.connected) {
        console.log('Receipt print skipped - bridge not connected');
        return;
    }

    if (!capabilities?.printer?.available) {
        console.log('Receipt print skipped - printer not available');
        return;
    }

    client.sendMessage('/app/printer/print', {
        type: 'receipt',
        data: receipt
    });
}

// Lane Lights (optional visual feedback)
export function setLightColor(color) {
    if (!client?.connected) return;
    if (!capabilities?.lights?.available) return;

    client.sendMessage('/app/lights/set', { color });
}

export function flashLight(color, count = 3) {
    if (!client?.connected) return;
    if (!capabilities?.lights?.available) return;

    client.sendMessage('/app/lights/flash', { color, count });
}
```

---

## Phase 3: Mock Peripheral Bridge (Development)

**Prereqs:** Phase 2 complete
**Blockers:** None

### 3.1 Mock Bridge Server

For development without real hardware, create a simple mock WebSocket server.

**Files:**
- CREATE: `apps/offline-pos/tools/mock-bridge.js`

**Implementation:**

```javascript
// mock-bridge.js - Mock peripheral bridge for development
// Run with: node tools/mock-bridge.js

import { WebSocketServer } from 'ws';
import readline from 'readline';

const wss = new WebSocketServer({ port: 9100 });
const clients = new Set();

const capabilities = {
    type: 'capabilities',
    timestamp: new Date().toISOString(),
    deviceId: 'mock-device',
    capabilities: {
        scanner: { available: true, mode: 'keyboard', symbologies: ['ean13', 'upc-a', 'qr'] },
        payment: { available: true, methods: ['chip', 'contactless'], cashback: false },
        printer: { available: true, type: 'thermal' },
        lights: { available: false }
    }
};

wss.on('connection', (ws) => {
    console.log('Client connected');
    clients.add(ws);

    ws.on('message', (data) => {
        const msg = data.toString();
        console.log('Received:', msg);

        // Handle STOMP CONNECT
        if (msg.startsWith('CONNECT')) {
            ws.send('CONNECTED\nversion:1.2\nheart-beat:0,0\n\n\x00');
            // Send capabilities after connect
            setTimeout(() => {
                sendMessage(ws, '/topic/capabilities', capabilities);
            }, 100);
        }

        // Handle SUBSCRIBE
        if (msg.startsWith('SUBSCRIBE')) {
            console.log('Subscription registered');
        }

        // Handle payment collect
        if (msg.includes('/app/payment/collect')) {
            console.log('Payment requested - simulating approval in 2s');
            setTimeout(() => {
                sendMessage(ws, '/topic/payment/events', {
                    event: 'approved',
                    status: 'approved',
                    transactionId: 'mock-' + Date.now(),
                    method: 'contactless',
                    cardBrand: 'visa',
                    last4: '4242',
                    authCode: 'MOCK123'
                });
            }, 2000);
        }
    });

    ws.on('close', () => {
        console.log('Client disconnected');
        clients.delete(ws);
    });
});

function sendMessage(ws, destination, body) {
    const frame = [
        'MESSAGE',
        `destination:${destination}`,
        'content-type:application/json',
        `message-id:msg-${Date.now()}`,
        '',
        JSON.stringify(body),
        '\x00'
    ].join('\n');
    ws.send(frame);
}

// CLI for simulating scans
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

console.log('Mock peripheral bridge running on ws://localhost:9100');
console.log('Type a barcode and press Enter to simulate a scan:');

rl.on('line', (barcode) => {
    if (barcode.trim()) {
        for (const ws of clients) {
            sendMessage(ws, '/topic/scanner/events', {
                event: 'scan',
                barcode: barcode.trim(),
                symbology: 'ean13'
            });
        }
        console.log(`Sent scan event: ${barcode}`);
    }
});

console.log('\nReady. Clients: 0');
```

---

## Phase 4: Integration with UI

**Prereqs:** Phases 1-3 complete
**Blockers:** None

### 4.1 Update Scan Page

The scan.html template already imports peripheral.js. Verify integration:

1. Scanner events trigger `addToCart()`
2. Cart updates show feedback
3. Graceful degradation if bridge unavailable

### 4.2 Update Payment Page

1. Card button triggers `collectPayment()`
2. Payment events update status display
3. Success redirects to complete page
4. Decline shows error message

### 4.3 Update Complete Page

1. Automatically calls `printReceipt()`
2. Silent failure if printer unavailable

---

## Files Summary

| Action | File | Purpose |
|--------|------|---------|
| CREATE | `apps/offline-pos/static/js/stomp.js` | STOMP protocol client |
| CREATE | `apps/offline-pos/static/js/peripheral.js` | Peripheral bridge API |
| CREATE | `apps/offline-pos/tools/mock-bridge.js` | Development mock server |

## Testing Strategy

### Manual Testing with Mock Bridge

```bash
# Terminal 1: Start mock bridge
cd apps/offline-pos
node tools/mock-bridge.js

# Terminal 2: Start POS app
go run .

# Terminal 3: Open browser
open http://localhost:3000

# In mock bridge terminal: type barcodes to simulate scans
> 012345678901
Sent scan event: 012345678901
```

### E2E Testing

Use Playwright with a mock WebSocket server to test full flows.

## Checklist

- [ ] STOMP client connects to bridge
- [ ] Capabilities received on connect
- [ ] Scanner events trigger callbacks
- [ ] Payment flow works end-to-end
- [ ] Receipt print attempted on complete
- [ ] Graceful degradation when bridge unavailable
- [ ] Mock bridge works for development

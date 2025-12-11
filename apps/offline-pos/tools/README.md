# Offline POS Development Tools

## Mock Peripheral Bridge

A mock WebSocket server that simulates a peripheral bridge for development without real hardware.

### Setup

Install dependencies:

```bash
cd apps/offline-pos/tools
npm install
```

### Running

```bash
node mock-bridge.js
```

The mock bridge will:
- Start WebSocket server on `ws://localhost:9100`
- Automatically send capabilities on client connection
- Accept STOMP protocol messages
- Simulate payment approval after 2 seconds

### Simulating Barcode Scans

While the mock bridge is running, type any barcode and press Enter:

```
Type a barcode and press Enter to simulate a scan:
> 012345678901
Sent scan event: 012345678901
```

The scan event will be broadcast to all connected clients via STOMP.

### Testing with the POS App

Terminal 1 - Start mock bridge:
```bash
cd apps/offline-pos/tools
node mock-bridge.js
```

Terminal 2 - Start POS app:
```bash
cd apps/offline-pos
go run .
```

Terminal 3 - Open browser:
```bash
open http://localhost:3000
```

Then type barcodes in Terminal 1 to simulate scanner input.

### Protocol

The mock bridge implements a subset of STOMP 1.2:
- `CONNECT` - Client connection
- `SUBSCRIBE` - Topic subscriptions
- `SEND` - Send messages to app destinations
- `MESSAGE` - Messages from topics

See `docs/ideas/2025-12-07-peripheral-integration-design.md` for full protocol specification.

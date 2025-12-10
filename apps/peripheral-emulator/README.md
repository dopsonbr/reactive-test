# Peripheral Emulator

Go-based emulator for retail peripheral devices. Provides WebSocket/STOMP server with scanner and payment terminal state machines, plus a web dashboard for testing.

## Quick Start

```bash
# Build and run
pnpm nx serve peripheral-emulator

# Or build binary
pnpm nx build peripheral-emulator
./dist/apps/peripheral-emulator/peripheral-emulator
```

**Endpoints:**
- WebSocket: `ws://localhost:9100/stomp`
- Dashboard: `http://localhost:9101`

## Features

### Scanner
- Enable/disable state
- Trigger scans with custom barcode and symbology
- Supported symbologies: EAN-13, UPC-A, QR, PDF417, Code128, Code39, DataMatrix

### Payment Terminal
- Full state machine: idle -> card_presented -> reading_card -> pin_required -> pin_entry -> authorizing -> approved/declined
- Support for chip, contactless, and swipe methods
- Configurable decline rate for testing
- Force approve/decline via control API

### Dashboard
- **Control Panel** - Toggle devices, trigger events, force state transitions
- **Message Log** - Live view of all STOMP messages
- **Try It** - Interactive mini-checkout demo

## HTTP Control API

### Scanner

```bash
# Enable scanner
curl -X POST http://localhost:9101/control/scanner/enable

# Disable scanner
curl -X POST http://localhost:9101/control/scanner/disable

# Trigger scan
curl -X POST http://localhost:9101/control/scanner/scan \
  -H "Content-Type: application/json" \
  -d '{"barcode": "0012345678905", "symbology": "ean13"}'
```

### Payment

```bash
# Simulate card insertion
curl -X POST http://localhost:9101/control/payment/insert \
  -H "Content-Type: application/json" \
  -d '{"method": "chip"}'

# Force approve
curl -X POST http://localhost:9101/control/payment/approve

# Force decline
curl -X POST http://localhost:9101/control/payment/decline \
  -H "Content-Type: application/json" \
  -d '{"reason": "insufficient_funds"}'
```

### State

```bash
# Get current device state
curl http://localhost:9101/control/state
```

## STOMP Destinations

### Subscribe (Client -> Emulator)
| Destination | Description |
|-------------|-------------|
| `/topic/capabilities` | Device capabilities |
| `/topic/scanner/events` | Scan events |
| `/topic/payment/events` | Payment state and result events |

### Send (Client -> Emulator)
| Destination | Description |
|-------------|-------------|
| `/app/scanner/enable` | Enable scanner |
| `/app/scanner/disable` | Disable scanner |
| `/app/payment/collect` | Start payment collection |
| `/app/payment/cancel` | Cancel payment |

## Configuration

Command-line flags:

| Flag | Default | Description |
|------|---------|-------------|
| `--port-ws` | 9100 | WebSocket server port |
| `--port-http` | 9101 | HTTP control server port |
| `--device-id` | emulator-001 | Device identifier |

## Project Structure

```
apps/peripheral-emulator/
├── main.go                          # Entry point
├── go.mod                           # Go module
├── dashboard/                       # Dashboard source files
├── internal/
│   ├── dashboard/                   # Embedded dashboard assets
│   │   ├── embed.go
│   │   └── static/
│   ├── scanner/                     # Scanner state machine
│   │   ├── scanner.go
│   │   └── scanner_test.go
│   ├── payment/                     # Payment state machine
│   │   ├── payment.go
│   │   └── payment_test.go
│   ├── server/                      # WebSocket + HTTP servers
│   │   └── server.go
│   └── stomp/                       # STOMP protocol handling
│       └── handler.go
└── project.json                     # Nx configuration
```

## Testing

```bash
# Run Go tests
cd apps/peripheral-emulator
go test ./...
```

## See Also

- [SDK Core](../../libs/frontend/peripheral-sdk/core/README.md)
- [SDK React](../../libs/frontend/peripheral-sdk/react/README.md)
- [API Reference](../../docs/peripheral-sdk/api-reference.md)

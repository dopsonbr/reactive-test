# Peripheral SDK - Agent Guidance

This directory contains the Peripheral SDK libraries for integrating with retail hardware peripherals (scanners, payment terminals).

## Structure

```
peripheral-sdk/
├── core/     # Framework-agnostic TypeScript library
└── react/    # React hooks and context
```

## Key Conventions

### Protocol Contract
- All STOMP message types are defined in `core/src/types/`
- Types are the contract between SDK and emulator - changes require coordination
- Do not add new message types without updating both SDK and emulator

### Testing Strategy
- Unit tests mock the STOMP client, not WebSocket
- Integration tests require the emulator running (`INTEGRATION_TESTS=true`)
- React tests mock the core library services

### State Management
- Core library is stateless except for connection state
- React hooks manage UI state derived from service events
- Payment state machine states must match emulator exactly

## Common Tasks

### Adding a New Peripheral Type
1. Define types in `core/src/types/`
2. Create service in `core/src/services/`
3. Add to PeripheralClient
4. Create React hook in `react/src/hooks/`
5. Update emulator with matching state machine

### Modifying STOMP Messages
1. Update types in `core/src/types/`
2. Update emulator message handling
3. Update any affected services/hooks
4. Update documentation in `docs/peripheral-sdk/`

## Dependencies

- `@stomp/stompjs` - STOMP protocol client
- React bindings depend on core (peer dependency pattern)

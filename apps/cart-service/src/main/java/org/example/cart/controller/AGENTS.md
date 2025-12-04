# Controller

## Boundaries
Files that require careful review before changes: all controller files

## Conventions
- All endpoints return Mono or Flux
- Context establishment happens via contextWrite at the end of the chain
- Structured logging uses Mono.deferContextual to access context
- Request metadata headers are mandatory and validated by Spring
- Controllers are organized by REST resource boundaries, not business capabilities

## Warnings
- Changing header names or URL patterns breaks contract with clients
- Context must be written before service calls to ensure propagation
- Logger name constants affect observability filtering and queries
- Each controller has a focused responsibility; avoid mixing resource concerns

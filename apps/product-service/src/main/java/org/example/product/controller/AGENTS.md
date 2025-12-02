# Controller

## Boundaries
Files that require careful review before changes: ProductController.java

## Conventions
- All endpoints return Mono or Flux
- Context establishment happens via contextWrite at the end of the chain
- Structured logging uses Mono.deferContextual to access context
- Request metadata headers are mandatory and validated by Spring

## Warnings
- Changing header names breaks contract with clients
- Context must be written before service calls to ensure propagation
- Logger name constant affects observability filtering and queries

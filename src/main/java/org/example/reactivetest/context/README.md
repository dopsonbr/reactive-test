# Context

## Purpose
Defines the structure and keys for request metadata that flows through reactive chains via Reactor Context.

## Behavior
Provides a type-safe record for storing request headers (store number, order number, user ID, session ID) and a constant key for accessing this metadata in the Reactor Context throughout the reactive pipeline.

## Quirks
- Context propagation uses Reactor Context, not MDC or ThreadLocal
- Metadata is immutable once created

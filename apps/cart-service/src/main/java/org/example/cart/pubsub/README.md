# Pub/Sub

## Purpose
Manages Redis Pub/Sub for real-time cart event distribution across service instances.

## Behavior
CartEventPublisher sends cart events to Redis channels (fire-and-forget); CartEventSubscriber provides Flux streams of events for GraphQL subscriptions with automatic reconnection on errors.

## Quirks
- Channel pattern: cart:{cartId}:events for individual carts, cart:store:{storeNumber}:events for store-wide
- Publish failures are logged but don't break mutations
- Subscribers receive events from all service instances

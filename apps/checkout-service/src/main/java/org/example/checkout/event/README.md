# event

## Purpose
Publishes OrderCompleted CloudEvents to Redis Streams for downstream consumption by audit and analytics services.

## Behavior
Wraps completed orders in CloudEvents format and publishes to the configured Redis stream. Events include order ID, total, and completion timestamp as CloudEvent attributes.

## Quirks
- Events are published asynchronously and do not block checkout completion
- Failed event publishes are retried via background job

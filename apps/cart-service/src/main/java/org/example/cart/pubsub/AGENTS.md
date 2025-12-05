# Pub/Sub

## Boundaries
Files requiring careful review: both files (Redis integration and error handling)

## Conventions
- Publisher uses fire-and-forget (onErrorResume to empty)
- Subscriber returns infinite Flux until cancelled
- Channel names must match between publisher and subscriber
- JSON serialization via ObjectMapper

## Warnings
- Channel name patterns must stay synchronized
- Publish failures are silently logged
- Subscription errors resume to empty Flux to prevent client disconnection

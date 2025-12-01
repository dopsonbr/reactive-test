# Context

## Boundaries
Files that require careful review before changes: all (core to reactive context propagation)

## Conventions
- RequestMetadata is immutable (Java record)
- ContextKeys uses a private constructor (utility class)
- The metadata key must match usage in filters and logging

## Warnings
- Changing the metadata key breaks context propagation across the entire application
- Adding fields to RequestMetadata requires updates in controller extraction logic

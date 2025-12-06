# dto

## Boundaries
Files that require careful review before changes: OrderSearchRequest.java (defaults affect API contract)

## Conventions
- All DTOs are immutable Java records
- Request provides pageOrDefault(), sizeOrDefault(), offset() helpers
- Response uses static factory method of() to compute hasMore

## Warnings
- Changing page size max (100) breaks API contract
- Default page size (20) affects performance expectations

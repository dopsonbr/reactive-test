# Controller

## Purpose
Exposes REST endpoints for inventory queries and updates.

## Behavior
Handles service-to-service calls (single SKU lookup) and merchant portal operations (list, low-stock alerts, updates). Returns DTOs for external calls, entities for portal.

## Quirks
- Update endpoint creates new records if SKU doesn't exist
- Low-stock threshold defaults to 10 units

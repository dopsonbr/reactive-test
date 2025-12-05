# Inventory Repository

## Purpose
Retrieves product availability quantities from the external inventory service.

## Behavior
Makes HTTP POST calls to the inventory service with SKU, applies resilience patterns (retry, circuit breaker, timeout), and uses cache as fallback after error exhaustion. On successful calls, updates cache with fresh data. Returns backordered status (-1) when both HTTP and cache fail.

## Quirks
- Uses **fallback-only** caching: HTTP first, cache only on error
- Returns -1 (backordered) when no cached data is available after errors
- Cache is updated on success but only read on failure

# controller

## Purpose
Exposes reactive REST endpoints for order retrieval and search operations.

## Behavior
Provides read-only access to orders via OAuth2-secured endpoints. Supports lookup by ID, order number, store, and customer. Search endpoint accepts optional filters for store, customer, status, and date range with pagination. All operations validate inputs before delegating to OrderService.

## Quirks
- Search without storeNumber or customerId returns empty results (not all orders)
- Customer search ignores pagination parameters and returns all matching orders
- Store+status search ignores date range and pagination parameters

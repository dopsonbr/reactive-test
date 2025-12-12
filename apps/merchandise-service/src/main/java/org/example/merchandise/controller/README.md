# controller

## Purpose
Exposes REST endpoints for product merchandise management and service-to-service integration.

## Behavior
Handles product CRUD operations via reactive endpoints, returns MerchandiseResponse for service-to-service calls and ProductEntity for management operations.

## Quirks
- GET /{sku} returns MerchandiseResponse (product-service contract)
- POST /products returns ProductEntity (full entity details)

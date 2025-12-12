# dto

## Purpose
Defines data transfer objects for API requests and responses.

## Behavior
Provides immutable records with validation for product operations and service-to-service communication.

## Quirks
- MerchandiseResponse is the contract for product-service integration
- CreateProductRequest requires SKU as input (not auto-generated)

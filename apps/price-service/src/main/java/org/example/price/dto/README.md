# org.example.price.dto

## Purpose
Defines data transfer objects for API requests and responses.

## Behavior
Provides immutable records for price data exchange with validation constraints on inbound requests.

## Quirks
- UpdatePriceRequest allows null originalPrice and currency, defaults applied in service layer

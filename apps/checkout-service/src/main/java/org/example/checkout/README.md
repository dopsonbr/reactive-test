# org.example.checkout

## Purpose

Root package containing the Spring Boot application entry point for checkout service orchestration.

## Behavior

Scans platform libraries for cross-cutting concerns (logging, resilience, error handling, security) and exposes checkout REST API via subpackages. Coordinates multi-service checkout flow with cart, discount, fulfillment, and payment services.

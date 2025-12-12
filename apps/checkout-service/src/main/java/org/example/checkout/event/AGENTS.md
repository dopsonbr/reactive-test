# event

## Boundaries
Files requiring careful review: CheckoutEventProperties.java (stream key changes affect consumers)

## Conventions
- All events follow CloudEvents 1.0 specification
- Event source is urn:reactive-platform:checkout-service
- Stream key is orders:completed

## Warnings
- Do not change event type string without coordinating with consumers
- Event publishing failures do not fail checkout transaction

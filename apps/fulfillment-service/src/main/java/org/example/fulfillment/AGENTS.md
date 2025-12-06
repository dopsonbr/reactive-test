# org.example.fulfillment

## Boundaries

Files that require careful review before changes:
- `FulfillmentServiceApplication.java` - component scan configuration affects platform library discovery

## Conventions

- Application scans org.example.fulfillment and platform library packages
- Port 8085 is canonical for fulfillment-service

## Warnings

- Do not modify scanBasePackages without verifying platform library auto-configuration

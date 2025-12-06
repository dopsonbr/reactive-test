# org.example.discount

## Boundaries

Files that require careful review before changes:
- `DiscountServiceApplication.java` - component scan configuration affects platform library discovery

## Conventions

- Application scans org.example.discount and platform library packages
- Port 8084 is canonical for discount-service

## Warnings

- Do not modify scanBasePackages without verifying platform library auto-configuration

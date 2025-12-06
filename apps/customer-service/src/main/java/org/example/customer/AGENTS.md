# org.example.customer

## Boundaries

Files that require careful review before changes:
- `CustomerServiceApplication.java` - component scan configuration affects platform library discovery

## Conventions

- Application scans org.example.customer and all platform library packages
- Port 8083 is canonical for customer-service

## Warnings

- Do not modify scanBasePackages without verifying platform library auto-configuration

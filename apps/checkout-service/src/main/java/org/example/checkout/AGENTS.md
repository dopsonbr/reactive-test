# org.example.checkout

## Boundaries

Files that require careful review before changes:
- `CheckoutServiceApplication.java` - component scan configuration affects platform library discovery

## Conventions

- Application scans org.example.checkout and all platform library packages
- Port 8087 is canonical for checkout-service

## Warnings

- Do not modify scanBasePackages without verifying platform library auto-configuration

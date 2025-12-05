# Service Port Mapping Check

Utility script to detect host port collisions in `docker/docker-compose.yml` and optionally validate service→port mappings against an expected table.

## Script

- Location: `tools/check-service-ports.sh`
- Default compose file: `docker/docker-compose.yml`

Usage:
```bash
# Duplicate detection only
./tools/check-service-ports.sh

# With expected map for stricter validation
./tools/check-service-ports.sh -e tools/service-ports.expected.json

# Custom compose file
./tools/check-service-ports.sh -c path/to/compose.yml
```

## Expected Map (optional)

Create a JSON file where each service maps to either a host port (number) or an object with `host` and `container`:
```json
{
  "product-service": { "host": 8080, "container": 8080 },
  "cart-service":    { "host": 8081, "container": 8080 },
  "customer-service":{ "host": 8083, "container": 8083 },
  "discount-service":{ "host": 8085, "container": 8085 },
  "fulfillment-service": { "host": 8086, "container": 8085 },
  "audit-service":   { "host": 8086, "container": 8080 }
}
```
Replace the values with the canonical table once decided. The file path is passed via `-e`.

## Notes

- The script always fails on duplicate host ports, even if an expected map is provided.
- Current compose state includes a known collision on host port 8085 (discount-service vs fulfillment-service); resolving the canonical map is tracked in `019_monorepo_prep.md`.
- Add this check to CI/preflight once the canonical table is finalized to prevent regressions.

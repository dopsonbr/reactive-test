# Service Port Mapping Check

Utility script to validate that canonical host ports in `tools/expected-ports.json` match the port mappings in `docker/docker-compose.yml`.

## Script

- Location: `tools/check-service-ports.mjs`
- Default compose file: `docker/docker-compose.yml`
- Canonical ports file: `tools/expected-ports.json`

Usage:
```bash
# Verify service ports match expected-ports.json
node tools/check-service-ports.mjs
```

## How It Works

For each service listed in `tools/expected-ports.json`, the script:

1. Looks up the service in `docker/docker-compose.yml`
2. Reads the service's first `ports:` entry
3. Compares the host port to the expected value

If a service isn't present in the compose file, it is reported as `SKIP`.

## Notes / Limitations

- This script does not currently detect duplicate host ports; it only checks “matches expected”.
- It assumes the first `ports:` mapping is the canonical host port for that service.
- To add or change a canonical port: update `tools/expected-ports.json` and `docker/docker-compose.yml`, then re-run the script.

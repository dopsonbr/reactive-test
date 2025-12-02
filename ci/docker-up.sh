#!/usr/bin/env bash
#
# Start the Docker Compose stack (observability + services)
#
# Usage: ./ci/docker-up.sh [--ci]
#
# Options:
#   --ci    Run in CI mode (wait for healthy, no interactive output)
#
# Default: Local mode (detached, shows service URLs)
#
# Prerequisites:
#   - Docker and Docker Compose installed
#   - Application JARs built (run ./ci/build-bootjars.sh first)
#

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

CI_MODE=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --ci)
            CI_MODE=true
            shift
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

cd "$ROOT_DIR/docker"

if [[ "$CI_MODE" == "true" ]]; then
    echo "==> Starting Docker Compose stack (CI mode)..."
    docker compose up -d --quiet-pull

    echo "==> Waiting for services to be healthy..."
    # Wait for product-service to be healthy (depends on other services)
    timeout 180 bash -c 'until docker compose ps product-service | grep -q "healthy"; do sleep 5; done'
    timeout 180 bash -c 'until docker compose ps cart-service | grep -q "healthy"; do sleep 5; done'

    echo "==> All services are healthy!"
else
    echo "==> Starting Docker Compose stack (local mode)..."
    docker compose up -d

    echo "==> Services starting..."
    echo "    - Grafana:         http://localhost:3000 (admin/admin)"
    echo "    - Prometheus:      http://localhost:9090"
    echo "    - Product Service: http://localhost:8080"
    echo "    - Cart Service:    http://localhost:8081"

    echo "==> Docker stack started!"
fi

#!/usr/bin/env bash
#
# Run k6 circuit breaker test against product-service
#
# This test validates circuit breaker behavior by triggering failures
# and verifying the circuit opens and closes appropriately.
#
# Usage: ./ci/e2e-circuit-breaker-test.sh [--ci]
#
# Options:
#   --ci    Run in CI mode (exit on completion)
#
# Default: Local mode (interactive output)
#
# Note: Automatically starts Docker stack if not running
#

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

# Load helper functions
source "$SCRIPT_DIR/_ensure-docker-stack.sh"

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

# Ensure Docker stack is running
ensure_docker_stack "$CI_MODE"

cd "$ROOT_DIR/docker"

if [[ "$CI_MODE" == "true" ]]; then
    echo "==> Running k6 circuit breaker test (CI mode)..."
    docker compose --profile chaos-product run --rm k6-product-circuit-breaker
else
    echo "==> Running k6 circuit breaker test (local mode)..."
    docker compose --profile chaos-product run k6-product-circuit-breaker
fi

echo "==> Circuit breaker test completed!"
if [[ "$CI_MODE" != "true" ]]; then
    echo "    View results in Grafana: http://localhost:3000"
fi

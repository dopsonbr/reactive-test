#!/usr/bin/env bash
#
# Run k6 load test against product-service
#
# Usage: ./ci/e2e-load-test.sh [--ci] [--vus <num>] [--iterations <num>]
#
# Options:
#   --ci               Run in CI mode (reduced load, quiet output)
#   --vus <num>        Number of virtual users (default: 50 local, 10 CI)
#   --iterations <num> Number of iterations (default: 10000 local, 100 CI)
#
# Default: Local mode (full load test)
#
# Note: Automatically starts Docker stack if not running
#

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

# Load helper functions
source "$SCRIPT_DIR/_ensure-docker-stack.sh"

CI_MODE=false
VUS=""
ITERATIONS=""

while [[ $# -gt 0 ]]; do
    case $1 in
        --ci)
            CI_MODE=true
            shift
            ;;
        --vus)
            VUS="$2"
            shift 2
            ;;
        --iterations)
            ITERATIONS="$2"
            shift 2
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Set defaults based on mode
if [[ "$CI_MODE" == "true" ]]; then
    VUS="${VUS:-10}"
    ITERATIONS="${ITERATIONS:-100}"
else
    VUS="${VUS:-50}"
    ITERATIONS="${ITERATIONS:-10000}"
fi

# Ensure test data and Docker stack are ready
ensure_test_data
ensure_docker_stack "$CI_MODE"

cd "$ROOT_DIR/docker"

if [[ "$CI_MODE" == "true" ]]; then
    echo "==> Running k6 load test (CI mode: VUs=$VUS, Iterations=$ITERATIONS)..."
else
    echo "==> Running k6 load test (local mode: VUs=$VUS, Iterations=$ITERATIONS)..."
fi

docker compose run --rm \
    -e K6_OUT=experimental-prometheus-rw \
    -e K6_PROMETHEUS_RW_SERVER_URL=http://prometheus:9090/api/v1/write \
    -e K6_PROMETHEUS_RW_TREND_AS_NATIVE_HISTOGRAM=true \
    -e BASE_URL=http://product-service:8090 \
    -e WIREMOCK_URL=http://wiremock:8080 \
    k6-product run --vus "$VUS" --iterations "$ITERATIONS" /scripts/load-test.js

echo "==> Load test completed!"
if [[ "$CI_MODE" != "true" ]]; then
    echo "    View results in Grafana: http://localhost:3000"
fi

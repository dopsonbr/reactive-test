#!/usr/bin/env bash
#
# Run k6 OAuth chaos test against product-service
#
# This test validates the service's behavior when downstream OAuth
# token server experiences failures (timeouts, 500s, 503s, expired tokens).
#
# Usage: ./ci/e2e-oauth-chaos-test.sh [--ci]
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
    echo "==> Running k6 OAuth chaos test (CI mode)..."
    docker compose --profile oauth-chaos run --rm k6-oauth-chaos
else
    echo "==> Running k6 OAuth chaos test (local mode)..."
    docker compose --profile oauth-chaos up k6-oauth-chaos
fi

echo "==> OAuth chaos test completed!"
if [[ "$CI_MODE" != "true" ]]; then
    echo "    View results in Grafana: http://localhost:3000"
fi

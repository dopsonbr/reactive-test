#!/usr/bin/env bash
#
# Stop the Docker Compose stack and clean up volumes
#
# Usage: ./ci/docker-down.sh [--ci]
#
# Options:
#   --ci    Run in CI mode (quiet output)
#
# Default: Local mode (verbose output)
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
    echo "==> Stopping Docker Compose stack (CI mode)..."
    docker compose --profile test-product --profile chaos-product down -v --remove-orphans 2>/dev/null || true
else
    echo "==> Stopping Docker Compose stack (local mode)..."
    docker compose --profile test-product --profile chaos-product down -v
fi

echo "==> Docker stack stopped and volumes removed!"

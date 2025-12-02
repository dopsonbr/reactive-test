#!/usr/bin/env bash
#
# Build bootable JARs for all applications (required before Docker)
#
# Usage: ./ci/build-bootjars.sh [--ci]
#
# Options:
#   --ci    Run in CI mode (no daemon, plain console output)
#
# Default: Local mode (uses Gradle daemon, rich console output)
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

cd "$ROOT_DIR"

GRADLE_OPTS=""
if [[ "$CI_MODE" == "true" ]]; then
    GRADLE_OPTS="--no-daemon --console=plain"
    echo "==> Building bootable JARs (CI mode)..."
else
    echo "==> Building bootable JARs (local mode)..."
fi

./gradlew :apps:product-service:bootJar :apps:cart-service:bootJar $GRADLE_OPTS

echo "==> Boot JARs built successfully!"
echo "    - apps/product-service/build/libs/"
echo "    - apps/cart-service/build/libs/"

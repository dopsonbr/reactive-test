#!/usr/bin/env bash
#
# Build all modules (platform libraries and applications)
#
# Usage: ./ci/build-all.sh [--ci]
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
    echo "==> Building all modules (CI mode)..."
else
    echo "==> Building all modules (local mode)..."
fi

./gradlew buildAll $GRADLE_OPTS

echo "==> Build completed successfully!"

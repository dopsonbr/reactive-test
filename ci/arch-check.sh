#!/usr/bin/env bash
#
# Run architecture tests with ArchUnit
#
# Verifies all applications follow layered architecture patterns:
# - Controllers don't access repositories directly
# - Domain objects have no framework dependencies
# - Proper layer dependencies are enforced
#
# Usage: ./ci/arch-check.sh [--ci]
#
# Options:
#   --ci    Run in CI mode (no daemon, plain console output)
#
# Exit codes:
#   0 - All architecture rules pass
#   1 - Architecture violations found
#

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

CI_MODE=false
GRADLE_OPTS=""

while [[ $# -gt 0 ]]; do
    case $1 in
        --ci)
            CI_MODE=true
            GRADLE_OPTS="--no-daemon --console=plain"
            shift
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

echo "Running architecture tests..."

cd "$ROOT_DIR"

# Run architecture tests for product-service
# (cart-service doesn't have ArchitectureTest yet - it's work-in-progress)
# Each app's ArchitectureTest extends shared rules from platform-test
if ./gradlew :apps:product-service:test --tests '*ArchitectureTest*' $GRADLE_OPTS; then
    echo ""
    echo "[PASS] All architecture rules pass"
    exit 0
else
    echo ""
    echo "[FAIL] Architecture violations found"
    echo ""
    echo "Review the test output above for specific violations"
    echo "See docs/standards/architecture.md for architecture rules"
    exit 1
fi

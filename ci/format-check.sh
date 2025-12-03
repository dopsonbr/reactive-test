#!/usr/bin/env bash
#
# Check code formatting with Spotless
#
# Verifies all Java code follows Google Java Format style.
# Use format-apply.sh to fix any formatting issues.
#
# Usage: ./ci/format-check.sh [--ci]
#
# Options:
#   --ci    Run in CI mode (no daemon, plain console output)
#
# Exit codes:
#   0 - All code is properly formatted
#   1 - Formatting issues found (run format-apply.sh to fix)
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

echo "Checking code formatting..."

cd "$ROOT_DIR"

if ./gradlew spotlessCheck $GRADLE_OPTS; then
    echo ""
    echo "[PASS] All code is properly formatted"
    exit 0
else
    echo ""
    echo "[FAIL] Formatting issues found"
    echo ""
    echo "Run './gradlew spotlessApply' or './ci/format-apply.sh' to fix"
    exit 1
fi

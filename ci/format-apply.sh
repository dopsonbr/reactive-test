#!/usr/bin/env bash
#
# Apply code formatting with Spotless
#
# Automatically formats all Java code to follow Google Java Format style.
#
# Usage: ./ci/format-apply.sh [--ci]
#
# Options:
#   --ci    Run in CI mode (no daemon, plain console output)
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

echo "Applying code formatting..."

cd "$ROOT_DIR"

if ./gradlew spotlessApply $GRADLE_OPTS; then
    echo ""
    echo "[PASS] Code formatting applied successfully"
    echo ""
    echo "Review changes with 'git diff' and commit when ready"
    exit 0
else
    echo ""
    echo "[FAIL] Failed to apply formatting"
    exit 1
fi

#!/usr/bin/env bash
#
# Pre-merge verification script
#
# Runs all checks to ensure code is ready for merging:
#   1. Build all modules
#   2. Run all unit tests
#   3. Build boot JARs (verify they can be packaged)
#
# Usage: ./ci/verify.sh [--ci]
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
CI_FLAG=""

while [[ $# -gt 0 ]]; do
    case $1 in
        --ci)
            CI_MODE=true
            CI_FLAG="--ci"
            shift
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

if [[ "$CI_MODE" == "true" ]]; then
    echo "=============================================="
    echo "  Pre-merge Verification (CI mode)"
    echo "=============================================="
else
    echo "=============================================="
    echo "  Pre-merge Verification (local mode)"
    echo "=============================================="
fi
echo ""

# Track overall status
FAILED=false

# Step 1: Build all modules
echo "----------------------------------------------"
echo "  Step 1/3: Building all modules"
echo "----------------------------------------------"
if "$SCRIPT_DIR/build-all.sh" $CI_FLAG; then
    echo "[PASS] Build completed"
else
    echo "[FAIL] Build failed"
    FAILED=true
fi
echo ""

# Step 2: Run all unit tests
echo "----------------------------------------------"
echo "  Step 2/3: Running all unit tests"
echo "----------------------------------------------"
if "$SCRIPT_DIR/test-unit.sh" $CI_FLAG; then
    echo "[PASS] All tests passed"
else
    echo "[FAIL] Tests failed"
    FAILED=true
fi
echo ""

# Step 3: Build boot JARs
echo "----------------------------------------------"
echo "  Step 3/3: Building boot JARs"
echo "----------------------------------------------"
if "$SCRIPT_DIR/build-bootjars.sh" $CI_FLAG; then
    echo "[PASS] Boot JARs built"
else
    echo "[FAIL] Boot JAR build failed"
    FAILED=true
fi
echo ""

# Summary
echo "=============================================="
echo "  Verification Summary"
echo "=============================================="

if [[ "$FAILED" == "true" ]]; then
    echo ""
    echo "  [FAIL] Verification FAILED - do not merge"
    echo ""
    exit 1
else
    echo ""
    echo "  [PASS] All checks passed - ready to merge"
    echo ""
    exit 0
fi

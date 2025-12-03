#!/usr/bin/env bash
#
# Pre-merge verification script
#
# Runs all checks to ensure code is ready for merging:
#   1. Check code formatting (Spotless)
#   2. Build all modules
#   3. Run architecture tests (ArchUnit)
#   4. Run all unit tests
#   5. Build boot JARs (verify they can be packaged)
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

# Step 1: Check code formatting
echo "----------------------------------------------"
echo "  Step 1/5: Checking code formatting"
echo "----------------------------------------------"
if "$SCRIPT_DIR/format-check.sh" $CI_FLAG; then
    echo "[PASS] Code formatting OK"
else
    echo "[FAIL] Code formatting issues found"
    echo "       Run './ci/format-apply.sh' to fix"
    FAILED=true
fi
echo ""

# Step 2: Build all modules
echo "----------------------------------------------"
echo "  Step 2/5: Building all modules"
echo "----------------------------------------------"
if "$SCRIPT_DIR/build-all.sh" $CI_FLAG; then
    echo "[PASS] Build completed"
else
    echo "[FAIL] Build failed"
    FAILED=true
fi
echo ""

# Step 3: Run architecture tests
echo "----------------------------------------------"
echo "  Step 3/5: Running architecture tests"
echo "----------------------------------------------"
if "$SCRIPT_DIR/arch-check.sh" $CI_FLAG; then
    echo "[PASS] Architecture tests passed"
else
    echo "[FAIL] Architecture violations found"
    FAILED=true
fi
echo ""

# Step 4: Run all unit tests
echo "----------------------------------------------"
echo "  Step 4/5: Running all unit tests"
echo "----------------------------------------------"
if "$SCRIPT_DIR/test-unit.sh" $CI_FLAG; then
    echo "[PASS] All tests passed"
else
    echo "[FAIL] Tests failed"
    FAILED=true
fi
echo ""

# Step 5: Build boot JARs
echo "----------------------------------------------"
echo "  Step 5/5: Building boot JARs"
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

#!/usr/bin/env bash
#
# Helper script to ensure Docker stack and test data are ready
# Called by e2e test scripts - not intended for direct use
#
# Usage: source ./_ensure-docker-stack.sh
#        ensure_docker_stack [--ci]
#        ensure_test_data
#

ensure_test_data() {
    local test_data_file="$ROOT_DIR/e2e/data/test-input.json"

    if [[ ! -f "$test_data_file" ]]; then
        echo "==> Test data not found, generating..."
        cd "$ROOT_DIR/e2e"
        node src/generate-input.js 1000
        cd "$ROOT_DIR"
    fi
}

ensure_docker_stack() {
    local ci_mode="${1:-false}"
    local ci_flag=""

    if [[ "$ci_mode" == "true" ]]; then
        ci_flag="--ci"
    fi

    cd "$ROOT_DIR/docker"

    # Check if product-service is running and healthy
    if docker compose ps product-service 2>/dev/null | grep -q "healthy"; then
        echo "==> Docker stack already running and healthy"
        return 0
    fi

    # Check if product-service is running but not yet healthy
    if docker compose ps product-service 2>/dev/null | grep -q "running"; then
        echo "==> Docker stack starting, waiting for health checks..."
        wait_for_healthy "$ci_mode"
        return 0
    fi

    # Stack not running - check if boot JARs exist
    if [[ ! -f "$ROOT_DIR/apps/product-service/build/libs/"*.jar ]] || \
       [[ ! -f "$ROOT_DIR/apps/cart-service/build/libs/"*.jar ]]; then
        echo "==> Boot JARs not found, building..."
        "$SCRIPT_DIR/build-bootjars.sh" $ci_flag
    fi

    # Start the stack
    echo "==> Starting Docker stack..."
    "$SCRIPT_DIR/docker-up.sh" $ci_flag
}

wait_for_healthy() {
    local ci_mode="${1:-false}"
    local timeout=180
    local elapsed=0

    echo "==> Waiting for services to be healthy (timeout: ${timeout}s)..."

    while [[ $elapsed -lt $timeout ]]; do
        if docker compose ps product-service 2>/dev/null | grep -q "healthy"; then
            echo "==> Services are healthy!"
            return 0
        fi
        sleep 5
        elapsed=$((elapsed + 5))
        if [[ "$ci_mode" != "true" ]]; then
            echo "    Waiting... (${elapsed}s)"
        fi
    done

    echo "ERROR: Timed out waiting for services to be healthy"
    exit 1
}

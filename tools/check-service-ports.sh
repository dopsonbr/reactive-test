#!/usr/bin/env bash
# Wrapper script to run the Node.js port verification
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec node "$SCRIPT_DIR/check-service-ports.js" "$@"

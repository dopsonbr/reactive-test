#!/usr/bin/env bash
# tools/verify-docs-index.sh
# Verifies that all documentation files are indexed in their README.md
set -euo pipefail

ERRORS=0

check_index() {
  local dir="$1"
  local index_file="$2"

  if [[ ! -d "$dir" ]]; then
    echo "SKIP: Directory does not exist: $dir"
    return
  fi

  if [[ ! -f "$index_file" ]]; then
    echo "ERROR: Missing index file: $index_file"
    ((ERRORS++))
    return
  fi

  for md_file in "$dir"/*.md; do
    [[ -f "$md_file" ]] || continue
    local basename=$(basename "$md_file")
    [[ "$basename" == "README.md" || "$basename" == "CONTENTS.md" || "$basename" == "AGENTS.md" ]] && continue

    if ! grep -q "$basename" "$index_file"; then
      echo "ERROR: $basename not listed in $index_file"
      ((ERRORS++))
    fi
  done
}

echo "Checking documentation indexes..."
echo ""

echo "Checking docs/standards/ ..."
check_index "docs/standards" "docs/standards/README.md"

echo "Checking docs/standards/backend/ ..."
check_index "docs/standards/backend" "docs/standards/backend/README.md"

echo "Checking docs/standards/frontend/ ..."
check_index "docs/standards/frontend" "docs/standards/frontend/README.md"

echo "Checking docs/templates/backend/ ..."
check_index "docs/templates/backend" "docs/templates/README.md"

echo "Checking docs/templates/frontend/ ..."
check_index "docs/templates/frontend" "docs/templates/README.md"

echo ""
if [[ $ERRORS -gt 0 ]]; then
  echo "Found $ERRORS index synchronization errors"
  exit 1
fi
echo "All documentation indexes are in sync"

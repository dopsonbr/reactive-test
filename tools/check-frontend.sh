#!/usr/bin/env bash
# tools/check-frontend.sh
# Run all frontend checks before submitting a PR.
# Usage: ./tools/check-frontend.sh [--graph] [--quick]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Track failures
FAILURES=()

# Parse arguments
SHOW_GRAPH=false
QUICK_MODE=false
for arg in "$@"; do
  case $arg in
    --graph)
      SHOW_GRAPH=true
      ;;
    --quick)
      QUICK_MODE=true
      ;;
  esac
done

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     Frontend Check Suite               ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""

# ─────────────────────────────────────────
# Phase 1: Environment Validation
# ─────────────────────────────────────────
echo -e "${YELLOW}[1/6] Validating environment...${NC}"

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
  echo -e "${RED}  ✗ Node.js 18+ required (found: $(node -v))${NC}"
  FAILURES+=("Node.js version")
else
  echo -e "${GREEN}  ✓ Node.js $(node -v)${NC}"
fi

# Check pnpm
if ! command -v pnpm &> /dev/null; then
  echo -e "${RED}  ✗ pnpm not found. Install: npm install -g pnpm${NC}"
  FAILURES+=("pnpm not installed")
else
  echo -e "${GREEN}  ✓ pnpm $(pnpm -v)${NC}"
fi

# Check nx
if ! pnpm nx --version &> /dev/null; then
  echo -e "${RED}  ✗ Nx not available. Run: pnpm install${NC}"
  FAILURES+=("Nx not available")
else
  echo -e "${GREEN}  ✓ Nx $(pnpm nx --version 2>/dev/null | head -1)${NC}"
fi

# Check dependencies installed
if [ ! -d "node_modules" ]; then
  echo -e "${YELLOW}  ⚠ node_modules not found. Running pnpm install...${NC}"
  pnpm install
fi

echo ""

# ─────────────────────────────────────────
# Phase 2: Project Graph Validation (optional)
# ─────────────────────────────────────────
if [ "$SHOW_GRAPH" = true ]; then
  echo -e "${YELLOW}[2/6] Validating project graph...${NC}"
  if pnpm nx graph --file=tmp-graph.json 2>/dev/null; then
    echo -e "${GREEN}  ✓ Project graph valid${NC}"
    rm -f tmp-graph.json
  else
    echo -e "${RED}  ✗ Project graph has errors${NC}"
    FAILURES+=("Project graph")
  fi
else
  echo -e "${YELLOW}[2/6] Project graph validation skipped (use --graph to enable)${NC}"
fi
echo ""

# ─────────────────────────────────────────
# Phase 3: ESLint (Module Boundaries + Custom Rules)
# ─────────────────────────────────────────
echo -e "${YELLOW}[3/6] Running ESLint...${NC}"
if pnpm lint:eslint 2>/dev/null; then
  echo -e "${GREEN}  ✓ ESLint passed${NC}"
else
  echo -e "${RED}  ✗ ESLint failed${NC}"
  FAILURES+=("ESLint")
fi
echo ""

# ─────────────────────────────────────────
# Phase 4: Stylelint (Design Tokens)
# ─────────────────────────────────────────
echo -e "${YELLOW}[4/6] Running Stylelint...${NC}"
if pnpm lint:styles 2>/dev/null; then
  echo -e "${GREEN}  ✓ Stylelint passed${NC}"
else
  echo -e "${RED}  ✗ Stylelint failed${NC}"
  FAILURES+=("Stylelint")
fi
echo ""

# ─────────────────────────────────────────
# Phase 5: Story/A11y/Test Coverage
# ─────────────────────────────────────────
echo -e "${YELLOW}[5/6] Checking coverage requirements...${NC}"

# UI component coverage
if pnpm lint:ui 2>/dev/null; then
  echo -e "${GREEN}  ✓ UI story/a11y coverage complete${NC}"
else
  echo -e "${RED}  ✗ Missing UI stories or a11y tests${NC}"
  FAILURES+=("UI coverage")
fi

# Feature test coverage
if pnpm lint:tests 2>/dev/null; then
  echo -e "${GREEN}  ✓ Feature test coverage complete${NC}"
else
  echo -e "${RED}  ✗ Missing feature tests${NC}"
  FAILURES+=("Feature tests")
fi
echo ""

# ─────────────────────────────────────────
# Phase 6: Tests (unless --quick)
# ─────────────────────────────────────────
if [ "$QUICK_MODE" = false ]; then
  echo -e "${YELLOW}[6/6] Running tests...${NC}"
  if pnpm test 2>/dev/null; then
    echo -e "${GREEN}  ✓ All tests passed${NC}"
  else
    echo -e "${RED}  ✗ Tests failed${NC}"
    FAILURES+=("Tests")
  fi
else
  echo -e "${YELLOW}[6/6] Tests skipped (--quick mode)${NC}"
fi
echo ""

# ─────────────────────────────────────────
# Summary
# ─────────────────────────────────────────
echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║               Summary                  ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"

if [ ${#FAILURES[@]} -eq 0 ]; then
  echo -e "${GREEN}✓ All checks passed! Ready for PR.${NC}"
  exit 0
else
  echo -e "${RED}✗ ${#FAILURES[@]} check(s) failed:${NC}"
  for failure in "${FAILURES[@]}"; do
    echo -e "${RED}  - $failure${NC}"
  done
  echo ""
  echo -e "${YELLOW}Run 'pnpm lint:fix' to auto-fix some issues.${NC}"
  exit 1
fi

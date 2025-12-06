# 024D_LINT_CI_INTEGRATION

**Status: COMPLETE**

---

## Overview

Wire all lint checks into CI, create unified `pnpm lint:all` script for local validation, build `tools/check-frontend.sh` wrapper, and document lint expectations in AGENTS.md.

**Parent Plan:** [024_FRONTEND_LINT_GUARDRAILS](./024_FRONTEND_LINT_GUARDRAILS.md)

**Prerequisites:**
- `024A_ESLINT_BOUNDARIES.md` complete (ESLint + custom plugin)
- `024B_DESIGN_TOKEN_STYLELINT.md` complete (Stylelint)
- `024C_STORY_A11Y_ENFORCEMENT.md` complete (Story/test enforcement)

**Blockers:**
- All lint tools must be installed and configured
- CI platform must be decided (GitHub Actions assumed)

---

## Goals

1. Create `pnpm lint:all` that chains all lint checks
2. Create `tools/check-frontend.sh` wrapper with tooling validation
3. Set up GitHub Actions workflow for lint CI
4. Document lint expectations in AGENTS.md
5. Provide clear failure summaries

---

## Exit Criteria

- [ ] `pnpm lint:all` runs all checks sequentially
- [ ] `tools/check-frontend.sh` validates environment and runs checks
- [ ] CI workflow fails on any lint violation
- [ ] AGENTS.md documents "Run pnpm lint:all before PR"

---

## Phase 1: Unified Lint Script

**Prereqs:** All lint scripts from 024A-C exist

**File:** MODIFY `package.json`

### 1.1 package.json Scripts

```json
{
  "scripts": {
    "lint": "nx run-many -t lint --all",
    "lint:eslint": "nx run-many -t lint --all",
    "lint:styles": "stylelint '**/*.css' --allow-empty-input",
    "lint:md": "markdownlint-cli2 '**/*.md'",
    "lint:stories": "tsx tools/lint-stories.ts --stories",
    "lint:a11y": "tsx tools/lint-stories.ts --a11y",
    "lint:ui": "tsx tools/lint-stories.ts",
    "lint:tests": "tsx tools/lint-tests.ts",
    "lint:tokens": "pnpm lint:styles && node tools/validate-tailwind-config.js",
    "lint:all": "pnpm lint:eslint && pnpm lint:styles && pnpm lint:ui && pnpm lint:tests && pnpm lint:md",
    "lint:fix": "nx run-many -t lint --all -- --fix && stylelint '**/*.css' --fix && markdownlint-cli2 --fix '**/*.md'",
    "test": "nx run-many -t test --all",
    "test:affected": "nx affected -t test",
    "e2e:smoke": "nx e2e e2e-web --configuration=smoke"
  }
}
```

### 1.2 Script Descriptions

| Script | Purpose |
|--------|---------|
| `lint:all` | Full lint suite (run before PR) |
| `lint:eslint` | Module boundaries + custom rules |
| `lint:styles` | Stylelint for CSS/Tailwind |
| `lint:ui` | Story + a11y presence checks |
| `lint:tests` | Feature test co-location |
| `lint:tokens` | Design token enforcement |
| `lint:md` | Markdown formatting |
| `lint:fix` | Auto-fix all fixable issues |

---

## Phase 2: Frontend Check Wrapper

**Prereqs:** Phase 1 complete

**File:** CREATE `tools/check-frontend.sh`

### 2.1 Comprehensive Check Script

```bash
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
if pnpm lint:eslint; then
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
if pnpm lint:styles; then
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
  if pnpm test; then
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
```

### 2.2 Make Executable

```bash
chmod +x tools/check-frontend.sh
```

---

## Phase 3: GitHub Actions CI Workflow

**Prereqs:** All lint scripts configured

**File:** CREATE `.github/workflows/lint.yml`

### 3.1 Lint Workflow

```yaml
# .github/workflows/lint.yml
name: Frontend Lint

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

jobs:
  lint:
    runs-on: ubuntu-latest
    timeout-minutes: 15

    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Setup pnpm
        uses: pnpm/action-setup@v4
        with:
          version: 9

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Derive Nx SHAs
        uses: nrwl/nx-set-shas@v4

      - name: ESLint (Module Boundaries)
        run: pnpm lint:eslint

      - name: Stylelint (Design Tokens)
        run: pnpm lint:styles

      - name: Story Coverage
        run: pnpm lint:stories

      - name: A11y Test Coverage
        run: pnpm lint:a11y

      - name: Feature Test Coverage
        run: pnpm lint:tests

      - name: Markdown Lint
        run: pnpm lint:md

  test:
    runs-on: ubuntu-latest
    timeout-minutes: 20
    needs: lint

    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Setup pnpm
        uses: pnpm/action-setup@v4
        with:
          version: 9

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Derive Nx SHAs
        uses: nrwl/nx-set-shas@v4

      - name: Run affected tests
        run: nx affected -t test --parallel=3

  e2e-smoke:
    runs-on: ubuntu-latest
    timeout-minutes: 30
    needs: lint
    if: github.event_name == 'pull_request'

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v4
        with:
          version: 9

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Install Playwright
        run: pnpm exec playwright install --with-deps chromium

      - name: Run E2E smoke tests
        run: pnpm e2e:smoke
```

---

## Phase 4: Documentation Updates

**Prereqs:** All lint tooling configured

**File:** MODIFY `AGENTS.md`

### 4.1 Add Lint Expectations Section

Add the following section to AGENTS.md:

```markdown
## Frontend Lint Expectations

All frontend code must pass lint checks before merging. Run these locally:

### Quick Check (Before Commit)
```bash
pnpm lint:all
```

### Full Check (Before PR)
```bash
./tools/check-frontend.sh
```

Or with project graph validation:
```bash
./tools/check-frontend.sh --graph
```

### Individual Lint Commands

| Command | What it Checks |
|---------|----------------|
| `pnpm lint:eslint` | Module boundaries, custom rules (design tokens, a11y, TanStack Query) |
| `pnpm lint:styles` | Stylelint for CSS, Tailwind arbitrary value ban |
| `pnpm lint:ui` | Story and a11y test presence for UI components |
| `pnpm lint:tests` | Feature component test co-location |
| `pnpm lint:md` | Markdown formatting |
| `pnpm lint:tokens` | Design token enforcement |
| `pnpm lint:fix` | Auto-fix all fixable issues |

### CI Enforcement

These checks run automatically on every PR:
1. **ESLint** - Module boundary violations fail the build
2. **Stylelint** - Arbitrary Tailwind values fail the build
3. **Story Coverage** - Missing UI stories fail the build
4. **A11y Coverage** - Missing accessibility tests fail the build
5. **Test Coverage** - Missing feature tests produce warnings

### Common Lint Errors

| Error | Fix |
|-------|-----|
| "Hardcoded color detected" | Use Tailwind semantic token (e.g., `bg-primary` not `bg-[#ff0000]`) |
| "Barrel export not allowed" | Replace `export * from` with named exports in feature folders |
| "Missing role attribute" | Add `role="button"` to clickable non-interactive elements |
| "Missing queryKey" | Add explicit `queryKey` array to useQuery calls |
| "Missing story" | Create `ComponentName.stories.tsx` alongside component |
| "Missing a11y test" | Create `ComponentName.a11y.test.tsx` with axe checks |
```

### 4.2 Update README.md

Add to root README.md in the Development section:

```markdown
### Frontend Lint

Before submitting a PR, run the full check suite:

```bash
./tools/check-frontend.sh
```

For quick local checks:
```bash
pnpm lint:all
```

To auto-fix issues:
```bash
pnpm lint:fix
```
```

---

## Phase 5: Nx Lint Target Configuration

**Prereqs:** Nx workspace configured

**File:** MODIFY `nx.json`

### 5.1 Configure Lint Targets

Ensure lint targets are properly configured:

```json
{
  "targetDefaults": {
    "lint": {
      "inputs": ["default", "{workspaceRoot}/.eslintrc.json", "{workspaceRoot}/eslint.config.js"],
      "cache": true
    },
    "test": {
      "inputs": ["default", "^production", "{workspaceRoot}/jest.preset.js"],
      "cache": true
    }
  },
  "namedInputs": {
    "default": ["{projectRoot}/**/*", "sharedGlobals"],
    "production": [
      "default",
      "!{projectRoot}/**/*.spec.ts",
      "!{projectRoot}/**/*.test.ts",
      "!{projectRoot}/**/*.stories.tsx"
    ],
    "sharedGlobals": [
      "{workspaceRoot}/eslint.config.js",
      "{workspaceRoot}/.stylelintrc.json",
      "{workspaceRoot}/tailwind.config.js"
    ]
  }
}
```

---

## Files Summary

| Action | File | Purpose |
|--------|------|---------|
| MODIFY | `package.json` | Add lint:all and related scripts |
| CREATE | `tools/check-frontend.sh` | Comprehensive check wrapper |
| CREATE | `.github/workflows/lint.yml` | CI lint workflow |
| MODIFY | `AGENTS.md` | Document lint expectations |
| MODIFY | `README.md` | Add lint section |
| MODIFY | `nx.json` | Configure lint targets |

---

## Testing Strategy

### Local Verification

```bash
# Run full check
./tools/check-frontend.sh

# Quick mode (skip tests)
./tools/check-frontend.sh --quick

# With graph validation
./tools/check-frontend.sh --graph

# Individual checks
pnpm lint:all
```

### CI Verification

After pushing, verify:
1. GitHub Actions workflow triggers
2. All lint jobs pass
3. Failed lint produces clear error messages

---

## Checklist

- [ ] Phase 1: lint:all script chains all checks
- [ ] Phase 2: check-frontend.sh wrapper created
- [ ] Phase 3: GitHub Actions workflow created
- [ ] Phase 4: AGENTS.md documents lint expectations
- [ ] Phase 5: Nx lint targets configured
- [ ] `pnpm lint:all` runs without errors
- [ ] `./tools/check-frontend.sh` validates environment
- [ ] CI workflow runs on PR
- [ ] Documentation complete

# 021E_MARKDOWN_LINT

**Status: DRAFT**

---

## Overview

Install and configure `markdownlint-cli2` for markdown linting across the repository.

**Parent Plan:** [021_FRONTEND_STANDARDS_INITIATIVE](./021_FRONTEND_STANDARDS_INITIATIVE.md)

**Prerequisites:**
- `020_NX_MONOREPO_IMPLEMENTATION.md` Phase 1.1 complete (`package.json` exists)

**Blockers:**
- `package.json` must exist at root
- Optional: `.pre-commit-config.yaml` for hook integration
- Optional: `.github/workflows/` for CI integration

---

## Goals

1. Install `markdownlint-cli2`
2. Configure rules appropriate for documentation
3. Add npm scripts for linting
4. (Optional) Pre-commit hook integration
5. (Optional) CI pipeline integration

---

## Exit Criteria

- [ ] `pnpm lint:md` runs without errors
- [ ] Configuration ignores build artifacts
- [ ] Line length allows code blocks

---

## Phase 1: Install and Configure

**Prereqs:** `package.json` exists

**Files:**
- CREATE: `.markdownlint-cli2.yaml`
- CREATE: `.markdownlintignore`
- MODIFY: `package.json`

### .markdownlint-cli2.yaml

```yaml
# .markdownlint-cli2.yaml
config:
  default: true
  MD013:
    line_length: 120
    code_blocks: false
    tables: false
  MD024: false          # Allow duplicate headings (common in standards)
  MD033: false          # Allow inline HTML
  MD034: false          # Allow bare URLs

ignores:
  - node_modules/**
  - "**/dist/**"
  - "**/build/**"
  - "**/target/**"
  - docker/**
```

### .markdownlintignore

```bash
# .markdownlintignore
node_modules/
dist/
build/
target/
.git/
```

### package.json Addition

```json
{
  "scripts": {
    "lint:md": "markdownlint-cli2 '**/*.md'",
    "lint:md:fix": "markdownlint-cli2 --fix '**/*.md'"
  },
  "devDependencies": {
    "markdownlint-cli2": "^0.19.0"
  }
}
```

**Commands:**
```bash
pnpm add -D markdownlint-cli2
```

---

## Phase 2: Pre-commit Integration (Optional)

**Prereqs:** `.pre-commit-config.yaml` exists

**File:** `.pre-commit-config.yaml`

Add to existing config:

```yaml
repos:
  - repo: https://github.com/DavidAnson/markdownlint-cli2
    rev: v0.19.1
    hooks:
      - id: markdownlint-cli2
        args: [--fix]
```

**Note:** Skip this phase if pre-commit is not set up. Can be added later.

---

## Phase 3: CI Integration (Optional)

**Prereqs:** `.github/workflows/` exists

**File:** `.github/workflows/lint.yml`

Add job to existing workflow or create new:

```yaml
name: Lint

on: [push, pull_request]

jobs:
  markdown-lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 9
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint:md
```

**Note:** Skip this phase if GitHub Actions is not set up. Can be added later.

---

## Files Summary

| Action | File | Purpose |
|--------|------|---------|
| CREATE | `.markdownlint-cli2.yaml` | Lint configuration |
| CREATE | `.markdownlintignore` | Ignore patterns |
| MODIFY | `package.json` | Add lint:md scripts and dependency |
| MODIFY | `.pre-commit-config.yaml` | (Optional) Hook integration |
| MODIFY | `.github/workflows/lint.yml` | (Optional) CI integration |

---

## Checklist

- [ ] Phase 1: markdownlint-cli2 installed and configured
- [ ] `pnpm lint:md` runs successfully
- [ ] `pnpm lint:md:fix` auto-fixes issues
- [ ] (Optional) Pre-commit hook catches markdown issues
- [ ] (Optional) CI validates markdown on PR

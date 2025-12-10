# 047: Documentation Static Site with VitePress

## Status

**Active** - Ready for implementation

## Summary

Convert the `/docs` directory into a VitePress static site serving both developers and AI agents. Consolidate implementation plans into `docs/plans/` with active/completed subdirectories, add AI navigation files, and create a repo explorer that mirrors markdown files from across the codebase.

## Goals

1. Serve documentation locally via VitePress dev server
2. Provide dual-audience navigation (humans + AI agents)
3. Consolidate all implementation plans under `docs/plans/`
4. Auto-generate repo explorer from codebase markdown files
5. Keep generated content out of git

## Non-Goals

- Deploying to external hosting (local dev focus for now)
- Changing existing markdown content
- Adding authentication or versioning

---

## Phase 1: Directory Restructuring

### Task 1.1: Create plans subdirectories

```bash
mkdir -p docs/plans/active
mkdir -p docs/plans/completed
```

### Task 1.2: Move active plans from repo root

Move these 6 files to `docs/plans/active/`:

- `033_FIX_JAVA_25_TEST_FAILURES.md`
- `040_API_CODEGEN.md`
- `042_USER_SERVICE_STANDARDS_REMEDIATION.md`
- `043_MODEL_ALIGNMENT.md`
- `044_SELF_CHECKOUT_KIOSK.md`
- `045_POS_SYSTEM.md`

```bash
mv 033_FIX_JAVA_25_TEST_FAILURES.md docs/plans/active/
mv 040_API_CODEGEN.md docs/plans/active/
mv 042_USER_SERVICE_STANDARDS_REMEDIATION.md docs/plans/active/
mv 043_MODEL_ALIGNMENT.md docs/plans/active/
mv 044_SELF_CHECKOUT_KIOSK.md docs/plans/active/
mv 045_POS_SYSTEM.md docs/plans/active/
```

### Task 1.3: Move archived plans to completed

Move all files from `docs/archive/` to `docs/plans/completed/`:

```bash
mv docs/archive/*.md docs/plans/completed/
mv docs/archive/not-implemented docs/plans/completed/
rmdir docs/archive
```

### Task 1.4: Update CLAUDE.md references

Update any references to plan locations in root `CLAUDE.md`:

- Change `docs/archive/` references to `docs/plans/completed/`
- Update plan creation instructions to use `docs/plans/active/`

---

## Phase 2: VitePress Setup

### Task 2.1: Install VitePress

```bash
pnpm add -Dw vitepress
```

### Task 2.2: Create VitePress config

Create `docs/.vitepress/config.ts`:

```ts
import { defineConfig } from 'vitepress';

export default defineConfig({
  title: 'Reactive Platform',
  description: 'Platform documentation for developers and AI agents',

  themeConfig: {
    nav: [
      { text: 'Standards', link: '/standards/' },
      { text: 'Plans', link: '/plans/active/' },
      { text: 'ADRs', link: '/ADRs/' },
      { text: 'Guides', link: '/end-user-guides/' },
      { text: 'Repo Explorer', link: '/repo-explorer/' },
    ],

    sidebar: {
      '/standards/': [
        {
          text: 'Standards',
          items: [
            { text: 'Overview', link: '/standards/' },
            { text: 'Code Style', link: '/standards/code-style' },
            { text: 'Documentation', link: '/standards/documentation' },
            {
              text: 'Backend',
              collapsed: false,
              items: [
                { text: 'Architecture', link: '/standards/backend/architecture' },
                { text: 'Caching', link: '/standards/backend/caching' },
                { text: 'Error Handling', link: '/standards/backend/error-handling' },
                { text: 'Models', link: '/standards/backend/models' },
                { text: 'Security', link: '/standards/backend/security' },
                { text: 'Validation', link: '/standards/backend/validation' },
              ],
            },
            {
              text: 'Frontend',
              collapsed: false,
              items: [
                { text: 'Architecture', link: '/standards/frontend/architecture' },
                { text: 'Components', link: '/standards/frontend/components' },
                { text: 'State Management', link: '/standards/frontend/state-management' },
                { text: 'Testing', link: '/standards/frontend/testing' },
              ],
            },
          ],
        },
      ],
      '/plans/': [
        {
          text: 'Plans',
          items: [
            { text: 'Active', link: '/plans/active/' },
            { text: 'Completed', link: '/plans/completed/' },
          ],
        },
      ],
      '/ADRs/': [
        {
          text: 'ADRs',
          items: [
            { text: 'Index', link: '/ADRs/' },
          ],
        },
      ],
      '/end-user-guides/': [
        {
          text: 'Guides',
          items: [
            { text: 'POS System', link: '/end-user-guides/pos-system/' },
            { text: 'Self-Checkout Kiosk', link: '/end-user-guides/self-checkout-kiosk/' },
          ],
        },
      ],
      '/repo-explorer/': [
        {
          text: 'Repository',
          items: [
            { text: 'Overview', link: '/repo-explorer/' },
          ],
        },
      ],
    },

    search: {
      provider: 'local',
    },

    outline: {
      level: [2, 3],
    },
  },

  ignoreDeadLinks: true,
});
```

### Task 2.3: Add npm scripts to package.json

```json
{
  "docs:dev": "node tools/docs-explorer/build-docs-explorer.js && vitepress dev docs",
  "docs:build": "node tools/docs-explorer/build-docs-explorer.js && vitepress build docs",
  "docs:preview": "vitepress preview docs",
  "docs:clean": "rm -rf docs/repo-explorer docs/.vitepress/cache docs/.vitepress/dist"
}
```

### Task 2.4: Update .gitignore

Add to root `.gitignore`:

```
# VitePress
docs/repo-explorer/
docs/.vitepress/cache/
docs/.vitepress/dist/
```

---

## Phase 3: Repo Explorer Script

### Task 3.1: Create build-docs-explorer.js

Create `tools/docs-explorer/build-docs-explorer.js` inside a directory that declares ESM explicitly:

```js
#!/usr/bin/env node

/**
 * Builds the docs/repo-explorer directory by copying markdown files
 * from across the repository, preserving directory structure.
 *
 * This allows browsing codebase documentation within VitePress
 * while keeping generated content out of git.
 */

import { glob } from 'glob';
import { copyFile, mkdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..', '..');
const OUTPUT = path.join(ROOT, 'docs', 'repo-explorer');

const INCLUDE_PATTERNS = [
  'apps/**/README.md',
  'apps/**/AGENTS.md',
  'apps/**/CONTENTS.md',
  'apps/**/PACKAGES.md',
  'libs/**/README.md',
  'libs/**/AGENTS.md',
  'libs/**/CONTENTS.md',
  'libs/**/PACKAGES.md',
  'CLAUDE.md',
  'README.md',
  '.claude/**/*',
  '.mcp.json',
];

const EXCLUDE_PATTERNS = [
  'node_modules/**',
  '**/node_modules/**',
  'docs/**',
  '**/build/**',
  '**/dist/**',
  '**/target/**',
];

async function clean() {
  try {
    await rm(OUTPUT, { recursive: true, force: true });
  } catch {
    // Directory may not exist
  }
}

async function copyFiles() {
  const files = await glob(INCLUDE_PATTERNS, {
    cwd: ROOT,
    ignore: EXCLUDE_PATTERNS,
    nodir: true,
    dot: true,
  });

  console.log(`Found ${files.length} files to copy`);

  for (const file of files) {
    const src = path.join(ROOT, file);
    const dest = path.join(OUTPUT, file);
    const destDir = path.dirname(dest);

    await mkdir(destDir, { recursive: true });
    await copyFile(src, dest);
    console.log(`  ${file}`);
  }
}

async function createIndex() {
  // Create index.md for repo-explorer root
  const indexContent = `# Repository Explorer

Browse documentation files from across the codebase.

This directory mirrors the actual repository structure, containing:
- README, AGENTS, CONTENTS, and PACKAGES files from apps and libs
- Root CLAUDE.md and README.md
- .claude/ directory (commands, settings)
- .mcp.json configuration

> **Note:** This content is auto-generated at build time. Do not edit directly.
`;

  await mkdir(OUTPUT, { recursive: true });
  await writeFile(path.join(OUTPUT, 'index.md'), indexContent);
}

async function main() {
  console.log('Building docs/repo-explorer...');
  await clean();
  await copyFiles();
  await createIndex();
  console.log('Done!');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

Create `tools/docs-explorer/package.json`:

```json
{
  "name": "@reactive-platform/docs-explorer",
  "private": true,
  "type": "module"
}
```

### Task 3.2: Make script executable

```bash
chmod +x tools/docs-explorer/build-docs-explorer.js
```

---

## Phase 4: Documentation Files

### Task 4.1: Create docs/index.md

```markdown
---
layout: home
hero:
  name: Reactive Platform
  tagline: Documentation for developers and AI agents
  actions:
    - theme: brand
      text: Standards
      link: /standards/
    - theme: alt
      text: Active Plans
      link: /plans/active/
features:
  - title: Standards
    details: Backend and frontend coding patterns, testing, resilience
  - title: Implementation Plans
    details: Active work and completed historical plans
  - title: ADRs
    details: Architectural Decision Records explaining key choices
  - title: Repo Explorer
    details: Browse documentation from across the codebase
---
```

### Task 4.2: Create docs/AGENTS.md

```markdown
# Documentation Site: Agent Guidance

## Purpose

Help AI agents navigate this documentation site efficiently.

## Quick Navigation

| Need | Location |
|------|----------|
| Current work | `/plans/active/` |
| Historical decisions | `/ADRs/` |
| Coding patterns | `/standards/backend/`, `/standards/frontend/` |
| Code templates | `/templates/` |
| Actual repo structure | `/repo-explorer/` |

## File Discovery Strategy

1. **For implementation tasks** - Check `/plans/active/` first
2. **For "how should I..." questions** - Check `/standards/`
3. **For "why was this..." questions** - Check `/ADRs/`
4. **For "where is..." questions** - Check `/repo-explorer/`

## Key Conventions

- Plans use `NNN_FEATURE_NAME.md` numbering (preserved from git history)
- Standards follow Intent → Outcomes → Patterns → Anti-patterns structure
- ADRs use MADR 4.0.0 format

## Do Not

- Cite standards verbatim in plans—reference by path
- Create new files in `/repo-explorer/`—it's auto-generated
- Edit files in `/plans/completed/`—they are historical records
```

### Task 4.3: Create docs/CONTENTS.md

```markdown
# Documentation Contents

## Site Structure

### Standards (`/standards/`)

- `README.md` - Standards overview and philosophy
- `code-style.md` - Formatting, naming conventions
- `documentation.md` - README/AGENTS/CONTENTS patterns
- `backend/` - 18 backend standards (architecture, testing, resilience, etc.)
- `frontend/` - 11 frontend standards (components, state, testing, etc.)

### Plans (`/plans/`)

- `active/` - Current implementation plans
- `completed/` - Historical plans with original numbering

### ADRs (`/ADRs/`)

- 13 Architectural Decision Records (MADR 4.0.0 format)
- Covers: caching, data stores, auth, frontend strategy, testing

### Guides (`/end-user-guides/`)

- `pos-system/` - Point of Sale user documentation (14 files)
- `self-checkout-kiosk/` - Self-checkout user documentation (15 files)

### Templates (`/templates/`)

- `backend/` - Controller, cache, repository patterns
- `frontend/` - Components, hooks, stories, tests

### Reference (`/repo-explorer/`) - Generated

- Mirrors actual repo structure
- Contains README, AGENTS, CONTENTS, PACKAGES files from codebase
- Includes `.claude/` and `.mcp.json` configuration

### Other

- `ideas/` - Design concepts
- `workflows/` - Development workflows
```

### Task 4.4: Create docs/plans/active/index.md

```markdown
# Active Implementation Plans

Current work in progress.

## Plans

<!-- List auto-populated by file system -->
```

### Task 4.5: Create docs/plans/completed/index.md

```markdown
# Completed Implementation Plans

Historical plans preserved with original numbering for git history reference.

## Plans

<!-- List auto-populated by file system -->
```

---

## Phase 5: Verification

### Task 5.1: Run docs dev server

```bash
pnpm docs:dev
```

Verify:
- [ ] Landing page loads at http://localhost:5173
- [ ] Standards navigation works
- [ ] Plans show active and completed sections
- [ ] Repo explorer contains copied files
- [ ] Search returns results

### Task 5.2: Verify gitignore

```bash
git status
```

Verify `docs/repo-explorer/` is not tracked.

### Task 5.3: Test clean build

```bash
pnpm docs:clean
pnpm docs:build
pnpm docs:preview
```

---

## File Summary

| Action | Path |
|--------|------|
| Create | `docs/.vitepress/config.ts` |
| Create | `docs/index.md` |
| Create | `docs/AGENTS.md` |
| Create | `docs/CONTENTS.md` |
| Create | `docs/plans/active/index.md` |
| Create | `docs/plans/completed/index.md` |
| Create | `tools/docs-explorer/build-docs-explorer.js` |
| Create | `tools/docs-explorer/package.json` |
| Move | 6 plans from root → `docs/plans/active/` |
| Move | 47 plans from `docs/archive/` → `docs/plans/completed/` |
| Delete | `docs/archive/` (after move) |
| Update | `package.json` (add scripts) |
| Update | `.gitignore` (add exclusions) |
| Update | `CLAUDE.md` (update plan references) |

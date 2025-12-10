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
  await rm(OUTPUT, { recursive: true, force: true });
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

/**
 * Generates VitePress sidebar config for repo-explorer with collapsed paths.
 *
 * Single-child directory chains are collapsed:
 *   src/main/java/org/example/product -> displayed as one expandable item
 *
 * Only expands when there are multiple children or markdown files.
 */

import { readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DOCS_ROOT = path.join(__dirname, '..', '..', 'docs');
const REPO_EXPLORER = path.join(DOCS_ROOT, 'repo-explorer');

/**
 * Check if a directory has only one subdirectory and no files
 */
async function isSingleChildDir(dirPath) {
  const entries = await readdir(dirPath, { withFileTypes: true });
  const dirs = entries.filter(e => e.isDirectory());
  const files = entries.filter(e => e.isFile() && e.name.endsWith('.md'));

  return dirs.length === 1 && files.length === 0;
}

/**
 * Collapse single-child directory chains into one path segment
 */
async function collapsePath(dirPath, basePath = '') {
  let currentPath = dirPath;
  let collapsedName = basePath;

  while (await isSingleChildDir(currentPath)) {
    const entries = await readdir(currentPath, { withFileTypes: true });
    const subdir = entries.find(e => e.isDirectory());
    collapsedName = collapsedName ? `${collapsedName}/${subdir.name}` : subdir.name;
    currentPath = path.join(currentPath, subdir.name);
  }

  return { collapsedPath: currentPath, collapsedName };
}

/**
 * Get title from first heading in markdown file, or use filename
 */
function getTitleFromFilename(filename) {
  const name = filename.replace(/\.md$/, '');
  if (name === 'index') return 'Overview';
  if (name === 'README') return 'README';
  if (name === 'AGENTS') return 'AGENTS';
  if (name === 'CONTENTS') return 'CONTENTS';
  if (name === 'PACKAGES') return 'PACKAGES';
  return name;
}

/**
 * Build sidebar items recursively with path collapsing
 */
async function buildSidebarItems(dirPath, urlPrefix) {
  const entries = await readdir(dirPath, { withFileTypes: true });
  const items = [];

  // Sort: directories first, then files
  const dirs = entries.filter(e => e.isDirectory()).sort((a, b) => a.name.localeCompare(b.name));
  const files = entries.filter(e => e.isFile() && e.name.endsWith('.md')).sort((a, b) => a.name.localeCompare(b.name));

  // Process directories
  for (const dir of dirs) {
    const fullPath = path.join(dirPath, dir.name);
    const { collapsedPath, collapsedName } = await collapsePath(fullPath, dir.name);

    const subEntries = await readdir(collapsedPath, { withFileTypes: true });
    const hasContent = subEntries.some(e => e.isFile() && e.name.endsWith('.md')) ||
                       subEntries.some(e => e.isDirectory());

    if (!hasContent) continue;

    const subItems = await buildSidebarItems(
      collapsedPath,
      `${urlPrefix}/${collapsedName.replace(/\//g, '/')}`
    );

    if (subItems.length > 0) {
      items.push({
        text: collapsedName,
        collapsed: true,
        items: subItems,
      });
    }
  }

  // Process markdown files
  for (const file of files) {
    if (file.name === 'index.md') continue; // Skip index files, they're folder links

    items.push({
      text: getTitleFromFilename(file.name),
      link: `${urlPrefix}/${file.name.replace(/\.md$/, '')}`,
    });
  }

  return items;
}

/**
 * Generate the full sidebar config for repo-explorer
 */
async function generateRepoExplorerSidebar() {
  try {
    await stat(REPO_EXPLORER);
  } catch {
    console.error('repo-explorer directory not found. Run build-docs-explorer.js first.');
    return null;
  }

  const items = await buildSidebarItems(REPO_EXPLORER, '/repo-explorer');

  return {
    '/repo-explorer/': [
      {
        text: 'Repository Explorer',
        items: [
          { text: 'Overview', link: '/repo-explorer/' },
          ...items,
        ],
      },
    ],
  };
}

// Export for use in VitePress config
export { generateRepoExplorerSidebar };

// CLI execution
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  generateRepoExplorerSidebar().then(sidebar => {
    console.log(JSON.stringify(sidebar, null, 2));
  });
}

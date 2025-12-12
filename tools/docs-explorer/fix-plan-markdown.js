#!/usr/bin/env node

import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..', '..');

// Files to process in place (fix markdown issues)
const FILES_TO_FIX = [
  path.join(ROOT, 'docs', 'plans', 'completed', '010_DEFINE_STANDARDS.md'),
];

/**
 * Add language hints to code fences that don't have them.
 * This prevents VitePress from parsing Java generics like List<Item> as Vue components.
 */
function addLanguageHints(content) {
  // Match code blocks without a language specifier
  // Replace ``` with ```text for blocks that look like they contain code with angle brackets
  return content.replace(/^```\s*$/gm, '```text');
}

function convertMarkdownFences(content) {
  const lines = content.split('\n');
  const markdownFenceIndices = [];

  lines.forEach((line, index) => {
    if (line.trimStart().startsWith('```markdown')) {
      markdownFenceIndices.push(index);
    }
  });

  markdownFenceIndices.forEach((startIndex, position) => {
    const line = lines[startIndex];
    lines[startIndex] = line.replace('```markdown', '````markdown');

    const searchEnd = markdownFenceIndices[position + 1] ?? lines.length;
    let closingIndex = -1;
    for (let idx = searchEnd - 1; idx > startIndex; idx -= 1) {
      if (lines[idx].trim() === '```') {
        closingIndex = idx;
        break;
      }
    }

    if (closingIndex === -1) {
      throw new Error(`Unable to find closing fence for markdown block starting at line ${startIndex + 1}`);
    }

    const closingLine = lines[closingIndex];
    const closingIndentMatch = closingLine.match(/^(\s*)/);
    const closingIndent = closingIndentMatch ? closingIndentMatch[1] : '';
    lines[closingIndex] = closingIndent + '````';
  });

  return lines.join('\n');
}

async function fixFile(filePath) {
  try {
    const raw = await readFile(filePath, 'utf8');
    let fixed = convertMarkdownFences(raw);
    fixed = addLanguageHints(fixed);
    await writeFile(filePath, fixed, 'utf8');
  } catch (err) {
    if (err.code === 'ENOENT') {
      // File doesn't exist, skip silently
      return;
    }
    throw err;
  }
}

async function main() {
  for (const file of FILES_TO_FIX) {
    await fixFile(file);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

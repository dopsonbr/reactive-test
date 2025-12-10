#!/usr/bin/env node

import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..', '..');

const PLAN_MAPPINGS = [
  {
    source: path.join(ROOT, 'docs', 'archive', '010_DEFINE_STANDARDS.md'),
    destination: path.join(ROOT, 'docs', 'plans', 'completed', '010_DEFINE_STANDARDS.md'),
  },
];

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

async function processPlan({ source, destination }) {
  const raw = await readFile(source, 'utf8');
  const fixed = convertMarkdownFences(raw);
  await writeFile(destination, fixed, 'utf8');
}

async function main() {
  for (const mapping of PLAN_MAPPINGS) {
    await processPlan(mapping);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

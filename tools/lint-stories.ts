#!/usr/bin/env npx tsx
// tools/lint-stories.ts
import { glob } from 'glob';
import * as fs from 'fs';
import * as path from 'path';

interface LintResult {
  file: string;
  missing: string;
  type: 'story' | 'a11y';
}

const UI_LIB_PATTERN = 'libs/frontend/shared-ui/**/src/**/*.tsx';
const STORY_SUFFIX = '.stories.tsx';
const A11Y_SUFFIX = '.a11y.test.tsx';

// Files to exclude (not components)
const EXCLUDE_PATTERNS = [
  '**/*.stories.tsx',
  '**/*.test.tsx',
  '**/*.spec.tsx',
  '**/index.tsx',
  '**/__tests__/**',
  '**/__mocks__/**',
  '**/types.tsx',
  '**/types/**',
  '**/utils/**',
  '**/hooks/**',
  '**/.ladle/**',
];

async function findUIComponents(): Promise<string[]> {
  const files = await glob(UI_LIB_PATTERN, {
    ignore: EXCLUDE_PATTERNS,
    absolute: true,
  });

  // Filter to only exported components (files with PascalCase names)
  return files.filter((file) => {
    const basename = path.basename(file, '.tsx');
    return /^[A-Z]/.test(basename); // PascalCase = component
  });
}

function checkFileExists(componentPath: string, suffix: string): boolean {
  const dir = path.dirname(componentPath);
  const basename = path.basename(componentPath, '.tsx');
  const targetPath = path.join(dir, `${basename}${suffix}`);

  // Also check for stories in a stories/ folder at lib level
  const libStoriesPath = componentPath
    .replace('/src/', '/stories/')
    .replace('.tsx', suffix);
  const componentsStoriesPath = componentPath
    .replace('/src/components/', '/stories/components/')
    .replace('.tsx', suffix);

  return (
    fs.existsSync(targetPath) ||
    fs.existsSync(libStoriesPath) ||
    fs.existsSync(componentsStoriesPath)
  );
}

async function lintStories(): Promise<LintResult[]> {
  const components = await findUIComponents();
  const results: LintResult[] = [];

  for (const component of components) {
    if (!checkFileExists(component, STORY_SUFFIX)) {
      results.push({
        file: component,
        missing: component.replace('.tsx', STORY_SUFFIX),
        type: 'story',
      });
    }
  }

  return results;
}

async function lintA11yTests(): Promise<LintResult[]> {
  const components = await findUIComponents();
  const results: LintResult[] = [];

  for (const component of components) {
    // Check for .a11y.test.tsx or regular .test.tsx (which should include axe tests)
    const hasA11yTest = checkFileExists(component, A11Y_SUFFIX);
    const hasRegularTest = checkFileExists(component, '.test.tsx');

    if (!hasA11yTest && !hasRegularTest) {
      results.push({
        file: component,
        missing: component.replace('.tsx', A11Y_SUFFIX),
        type: 'a11y',
      });
    }
  }

  return results;
}

async function main() {
  const args = process.argv.slice(2);
  const checkStories = args.includes('--stories') || args.length === 0;
  const checkA11y = args.includes('--a11y') || args.length === 0;

  let hasErrors = false;

  if (checkStories) {
    console.log('🔍 Checking story coverage for UI components...\n');
    const storyResults = await lintStories();

    if (storyResults.length > 0) {
      hasErrors = true;
      console.error('❌ Missing Ladle stories:\n');
      storyResults.forEach((r) => {
        console.error(`  Component: ${path.relative(process.cwd(), r.file)}`);
        console.error(
          `  Missing:   ${path.relative(process.cwd(), r.missing)}\n`
        );
      });
    } else {
      console.log('✅ All UI components have Ladle stories.\n');
    }
  }

  if (checkA11y) {
    console.log('🔍 Checking a11y test coverage for UI components...\n');
    const a11yResults = await lintA11yTests();

    if (a11yResults.length > 0) {
      hasErrors = true;
      console.error('❌ Missing accessibility tests:\n');
      a11yResults.forEach((r) => {
        console.error(`  Component: ${path.relative(process.cwd(), r.file)}`);
        console.error(
          `  Missing:   ${path.relative(process.cwd(), r.missing)}\n`
        );
      });
    } else {
      console.log('✅ All UI components have accessibility tests.\n');
    }
  }

  if (hasErrors) {
    console.error(
      '\n💡 Tip: Create missing files using the ui-component generator:'
    );
    console.error(
      '    pnpm nx g @reactive-platform/workspace-plugin:ui-component ComponentName\n'
    );
    process.exit(1);
  }

  console.log('🎉 All UI lint checks passed!');
  process.exit(0);
}

main().catch((err) => {
  console.error('Error running lint-stories:', err);
  process.exit(1);
});

#!/usr/bin/env npx tsx
// tools/lint-tests.ts
import { glob } from 'glob';
import * as fs from 'fs';
import * as path from 'path';

interface TestResult {
  component: string;
  missingTest: string;
  missingFixture: boolean;
}

const FEATURE_PATTERN = 'apps/*/src/features/**/components/**/*.tsx';
const TEST_SUFFIX = '.test.tsx';

// Exclude patterns
const EXCLUDE_PATTERNS = [
  '**/*.test.tsx',
  '**/*.spec.tsx',
  '**/*.stories.tsx',
  '**/index.tsx',
  '**/__tests__/**',
  '**/__mocks__/**',
  '**/__fixtures__/**',
];

async function findFeatureComponents(): Promise<string[]> {
  const files = await glob(FEATURE_PATTERN, {
    ignore: EXCLUDE_PATTERNS,
    absolute: true,
  });

  // Filter to PascalCase component files
  return files.filter((file) => {
    const basename = path.basename(file, '.tsx');
    return /^[A-Z]/.test(basename);
  });
}

function hasColocatedTest(componentPath: string): boolean {
  const testPath = componentPath.replace('.tsx', TEST_SUFFIX);
  return fs.existsSync(testPath);
}

function hasFixtureFolder(componentPath: string): boolean {
  const dir = path.dirname(componentPath);
  const fixtureDir = path.join(dir, '__fixtures__');
  const mocksDir = path.join(dir, '__mocks__');
  return fs.existsSync(fixtureDir) || fs.existsSync(mocksDir);
}

async function lintFeatureTests(): Promise<TestResult[]> {
  const components = await findFeatureComponents();
  const results: TestResult[] = [];

  for (const component of components) {
    const hasTest = hasColocatedTest(component);
    const hasFixture = hasFixtureFolder(component);

    if (!hasTest) {
      results.push({
        component,
        missingTest: component.replace('.tsx', TEST_SUFFIX),
        missingFixture: !hasFixture,
      });
    }
  }

  return results;
}

async function main() {
  console.log('🔍 Checking test co-location for feature components...\n');

  const results = await lintFeatureTests();

  if (results.length > 0) {
    console.error('❌ Missing co-located tests:\n');

    results.forEach((r) => {
      console.error(`  Component: ${path.relative(process.cwd(), r.component)}`);
      console.error(
        `  Missing:   ${path.relative(process.cwd(), r.missingTest)}`
      );
      if (r.missingFixture) {
        console.error(`  Warning:   No __fixtures__ or __mocks__ folder found`);
      }
      console.error('');
    });

    console.error(
      '\n💡 Tip: Create a test file next to your component with the same name + .test.tsx'
    );
    console.error(
      '💡 Tip: Create __fixtures__/mockData.ts for test data\n'
    );

    process.exit(1);
  }

  console.log('✅ All feature components have co-located tests.');
  process.exit(0);
}

main().catch((err) => {
  console.error('Error running lint-tests:', err);
  process.exit(1);
});

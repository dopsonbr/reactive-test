# 024C_STORY_A11Y_ENFORCEMENT

**Status: DRAFT**

---

## Overview

Create scripts and lint rules to enforce that every exported UI component has a Ladle story and an axe accessibility test, and that feature components have co-located `.test.tsx` files with mock data fixtures.

**Parent Plan:** [024_FRONTEND_LINT_GUARDRAILS](./024_FRONTEND_LINT_GUARDRAILS.md)

**Prerequisites:**
- `020_NX_MONOREPO_IMPLEMENTATION.md` Phase 1.1 complete (pnpm, package.json)
- Ladle configured (per ADR-009)
- Vitest configured (per ADR-009)

**Blockers:**
- UI component libs must exist in `libs/shared-ui/`
- Feature folders must follow pattern `apps/*/src/features/`

---

## Goals

1. Script to verify every exported UI component has a `.stories.tsx`
2. Script to verify every UI component has an axe accessibility test
3. Script to verify feature components have co-located tests
4. Lint target `lint:ui` for story/a11y presence
5. Clear error messages listing missing files

---

## Exit Criteria

- [ ] `pnpm lint:stories` passes when all stories exist
- [ ] `pnpm lint:a11y` passes when all axe tests exist
- [ ] `pnpm lint:tests` passes when feature tests exist
- [ ] Missing files produce clear, actionable errors
- [ ] Scripts exit with non-zero code on failure

---

## Phase 1: Story Coverage Checker

**Prereqs:** `package.json` exists, Ladle configured

**File:** CREATE `tools/lint-stories.ts`

### 1.1 Story Coverage Script

```typescript
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

const UI_LIB_PATTERN = 'libs/shared-ui/**/src/**/*.tsx';
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
  return fs.existsSync(targetPath);
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
    if (!checkFileExists(component, A11Y_SUFFIX)) {
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
        console.error(`  Missing:   ${path.relative(process.cwd(), r.missing)}\n`);
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
        console.error(`  Missing:   ${path.relative(process.cwd(), r.missing)}\n`);
      });
    } else {
      console.log('✅ All UI components have accessibility tests.\n');
    }
  }

  if (hasErrors) {
    console.error('\n💡 Tip: Create missing files using the templates in docs/templates/frontend/');
    process.exit(1);
  }

  console.log('🎉 All UI lint checks passed!');
  process.exit(0);
}

main().catch((err) => {
  console.error('Error running lint-stories:', err);
  process.exit(1);
});
```

### 1.2 Add to package.json

```json
{
  "scripts": {
    "lint:stories": "tsx tools/lint-stories.ts --stories",
    "lint:a11y": "tsx tools/lint-stories.ts --a11y",
    "lint:ui": "tsx tools/lint-stories.ts"
  },
  "devDependencies": {
    "tsx": "^4.7.0",
    "glob": "^10.3.10"
  }
}
```

---

## Phase 2: Feature Test Co-location Checker

**Prereqs:** `package.json` exists, Vitest configured

**File:** CREATE `tools/lint-tests.ts`

### 2.1 Feature Test Checker Script

```typescript
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
      console.error(`  Missing:   ${path.relative(process.cwd(), r.missingTest)}`);
      if (r.missingFixture) {
        console.error(`  Warning:   No __fixtures__ or __mocks__ folder found`);
      }
      console.error('');
    });

    console.error('\n💡 Tip: Use the template at docs/templates/frontend/_template_vitest.md');
    console.error('💡 Tip: Create __fixtures__/mockData.ts for test data\n');

    process.exit(1);
  }

  console.log('✅ All feature components have co-located tests.');
  process.exit(0);
}

main().catch((err) => {
  console.error('Error running lint-tests:', err);
  process.exit(1);
});
```

### 2.2 Add to package.json

```json
{
  "scripts": {
    "lint:tests": "tsx tools/lint-tests.ts"
  }
}
```

---

## Phase 3: Accessibility Test Template

**Prereqs:** Vitest and axe-core configured

**File:** UPDATE `docs/templates/frontend/_template_a11y_test.md`

### 3.1 A11y Test Template

```markdown
# Accessibility Test Template

## Usage
Every UI component in libs/shared-ui must have an accessibility test.

## Structure
// {component}.a11y.test.tsx
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { describe, it, expect } from 'vitest';
import { {Component} } from './{component}';

expect.extend(toHaveNoViolations);

describe('{Component} Accessibility', () => {
  it('has no accessibility violations (default)', async () => {
    const { container } = render(<{Component}>Content</{Component}>);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('has no violations with all variants', async () => {
    const { container } = render(
      <div>
        <{Component} variant="primary">Primary</{Component}>
        <{Component} variant="secondary">Secondary</{Component}>
        <{Component} disabled>Disabled</{Component}>
      </div>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('is keyboard accessible', () => {
    render(<{Component}>Content</{Component}>);
    const element = screen.getByRole('button'); // adjust role
    element.focus();
    expect(document.activeElement).toBe(element);
  });
});

## Required axe Rules
- All interactive elements must have accessible names
- Color contrast meets WCAG AA
- Focus indicators are visible
- Form inputs have labels

## Dependencies
```json
{
  "devDependencies": {
    "jest-axe": "^9.0.0",
    "@axe-core/react": "^4.8.0"
  }
}
```
```

---

## Phase 4: Fixture Template

**Prereqs:** Feature test pattern established

**File:** CREATE `docs/templates/frontend/_template_test_fixtures.md`

### 4.1 Test Fixture Template

```markdown
# Test Fixtures Template

## Usage
Feature components should have co-located mock data in __fixtures__ folder.

## Structure
features/{domain}/components/
├── {ComponentName}.tsx
├── {ComponentName}.test.tsx
└── __fixtures__/
    ├── mockData.ts
    └── handlers.ts (MSW handlers if needed)

## mockData.ts Example
// __fixtures__/mockData.ts
import type { Product, Cart } from '../types';

export const mockProduct: Product = {
  id: 'SKU-001',
  name: 'Test Product',
  price: 29.99,
  description: 'A test product for unit tests',
  inStock: true,
};

export const mockProducts: Product[] = [
  mockProduct,
  { ...mockProduct, id: 'SKU-002', name: 'Second Product' },
];

export const mockCart: Cart = {
  id: 'cart-001',
  items: [{ productId: 'SKU-001', quantity: 2 }],
  total: 59.98,
};

// Factory functions for variations
export function createMockProduct(overrides: Partial<Product> = {}): Product {
  return { ...mockProduct, ...overrides };
}

## handlers.ts Example (MSW)
// __fixtures__/handlers.ts
import { http, HttpResponse } from 'msw';
import { mockProducts } from './mockData';

export const handlers = [
  http.get('/api/products', () => {
    return HttpResponse.json(mockProducts);
  }),
  http.get('/api/products/:id', ({ params }) => {
    const product = mockProducts.find(p => p.id === params.id);
    if (!product) {
      return new HttpResponse(null, { status: 404 });
    }
    return HttpResponse.json(product);
  }),
];

## Usage in Tests
// {ComponentName}.test.tsx
import { mockProduct, createMockProduct } from './__fixtures__/mockData';

describe('ProductCard', () => {
  it('renders product info', () => {
    render(<ProductCard product={mockProduct} />);
    expect(screen.getByText('Test Product')).toBeInTheDocument();
  });

  it('handles out of stock', () => {
    const outOfStock = createMockProduct({ inStock: false });
    render(<ProductCard product={outOfStock} />);
    expect(screen.getByText('Out of Stock')).toBeInTheDocument();
  });
});
```

---

## Phase 5: ESLint Rule for Test Co-location

**Prereqs:** `eslint-plugin-reactive` exists from 024A

**File:** CREATE `tools/eslint-plugin-reactive/rules/require-colocated-test.js`

### 5.1 ESLint Rule

```javascript
// tools/eslint-plugin-reactive/rules/require-colocated-test.js
const fs = require('fs');
const path = require('path');

module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Require co-located test files for feature components.',
      recommended: false,
    },
    messages: {
      missingTest: 'Feature component "{{name}}" should have a co-located test file: {{expected}}',
    },
    schema: [],
  },
  create(context) {
    const filename = context.getFilename();

    // Only apply to feature components
    if (!filename.includes('/features/') || !filename.includes('/components/')) {
      return {};
    }

    // Skip test files, stories, etc.
    if (
      filename.endsWith('.test.tsx') ||
      filename.endsWith('.stories.tsx') ||
      filename.includes('__')
    ) {
      return {};
    }

    return {
      Program(node) {
        const testPath = filename.replace('.tsx', '.test.tsx');
        if (!fs.existsSync(testPath)) {
          context.report({
            node,
            messageId: 'missingTest',
            data: {
              name: path.basename(filename),
              expected: path.basename(testPath),
            },
          });
        }
      },
    };
  },
};
```

### 5.2 Update Plugin Index

```javascript
// Add to tools/eslint-plugin-reactive/index.js
module.exports = {
  rules: {
    // ... existing rules ...
    'require-colocated-test': require('./rules/require-colocated-test'),
  },
  configs: {
    recommended: {
      rules: {
        // ... existing rules ...
        'reactive/require-colocated-test': 'warn', // warn, not error
      },
    },
  },
};
```

---

## Files Summary

| Action | File | Purpose |
|--------|------|---------|
| CREATE | `tools/lint-stories.ts` | Story + a11y coverage checker |
| CREATE | `tools/lint-tests.ts` | Feature test co-location checker |
| CREATE | `docs/templates/frontend/_template_a11y_test.md` | A11y test template |
| CREATE | `docs/templates/frontend/_template_test_fixtures.md` | Fixture template |
| CREATE | `tools/eslint-plugin-reactive/rules/require-colocated-test.js` | ESLint rule |
| MODIFY | `tools/eslint-plugin-reactive/index.js` | Add new rule |
| MODIFY | `package.json` | Add lint:stories, lint:a11y, lint:tests, lint:ui |

---

## Testing Strategy

### Manual Verification

```bash
# Check story coverage
pnpm lint:stories

# Check a11y test coverage
pnpm lint:a11y

# Check both
pnpm lint:ui

# Check feature test co-location
pnpm lint:tests
```

### Test the Scripts

```bash
# Create a component without story
mkdir -p libs/shared-ui/test-button/src
echo 'export const TestButton = () => <button>Test</button>' > libs/shared-ui/test-button/src/TestButton.tsx

# Run checker (should fail)
pnpm lint:stories

# Create story
echo 'export const Default = () => <TestButton />' > libs/shared-ui/test-button/src/TestButton.stories.tsx

# Run checker (should pass)
pnpm lint:stories

# Cleanup
rm -rf libs/shared-ui/test-button
```

---

## Checklist

- [ ] Phase 1: Story coverage checker working
- [ ] Phase 2: Feature test checker working
- [ ] Phase 3: A11y test template created
- [ ] Phase 4: Fixture template created
- [ ] Phase 5: ESLint rule for test co-location added
- [ ] `pnpm lint:ui` runs both story and a11y checks
- [ ] `pnpm lint:tests` checks feature test co-location
- [ ] Missing files produce clear error messages

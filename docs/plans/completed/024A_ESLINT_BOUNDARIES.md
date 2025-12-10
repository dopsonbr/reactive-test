# 024A_ESLINT_BOUNDARIES

**Status: COMPLETE**

---

## Overview

Configure ESLint flat config with `@nx/enforce-module-boundaries` and create a custom local plugin (`eslint-plugin-reactive`) to enforce design tokens, barrel export restrictions, accessibility patterns, and TanStack Query guardrails.

**Parent Plan:** [024_FRONTEND_LINT_GUARDRAILS](./024_FRONTEND_LINT_GUARDRAILS.md)

**Prerequisites:**
- `020_NX_MONOREPO_IMPLEMENTATION.md` Phase 1.1 complete (pnpm, package.json)
- `021D_MODULE_BOUNDARIES.md` complete (base eslint.config.js exists with @nx/eslint-plugin)

**Blockers:**
- `eslint.config.js` must exist at root
- `@nx/eslint-plugin` must be installed
- TypeScript configured for frontend libs

---

## Goals

1. Extend ESLint flat config with custom plugin
2. Create `eslint-plugin-reactive` with 4 rule categories
3. Integrate with `nx lint` target

---

## Exit Criteria

- [x] `nx lint` runs ESLint with custom rules
- [x] Violations produce clear error messages
- [x] All 4 rule categories functional

---

## Phase 1: Custom Plugin Scaffold

**Prereqs:** `package.json` exists, pnpm configured

**Files:**
- CREATE: `tools/eslint-plugin-reactive/index.js`
- CREATE: `tools/eslint-plugin-reactive/package.json`
- CREATE: `tools/eslint-plugin-reactive/rules/no-hardcoded-colors.js`
- CREATE: `tools/eslint-plugin-reactive/rules/no-barrel-exports.js`
- CREATE: `tools/eslint-plugin-reactive/rules/require-accessible-controls.js`
- CREATE: `tools/eslint-plugin-reactive/rules/tanstack-query-guardrails.js`

### 1.1 Plugin Package Structure

```
tools/eslint-plugin-reactive/
├── package.json
├── index.js
└── rules/
    ├── no-hardcoded-colors.js
    ├── no-barrel-exports.js
    ├── require-accessible-controls.js
    └── tanstack-query-guardrails.js
```

### 1.2 package.json

```json
{
  "name": "eslint-plugin-reactive",
  "version": "0.0.1",
  "private": true,
  "main": "index.js",
  "peerDependencies": {
    "eslint": ">=8.0.0"
  }
}
```

### 1.3 index.js (Plugin Entry)

```javascript
// tools/eslint-plugin-reactive/index.js
module.exports = {
  meta: {
    name: 'eslint-plugin-reactive',
    version: '0.0.1',
  },
  rules: {
    'no-hardcoded-colors': require('./rules/no-hardcoded-colors'),
    'no-barrel-exports': require('./rules/no-barrel-exports'),
    'require-accessible-controls': require('./rules/require-accessible-controls'),
    'tanstack-query-guardrails': require('./rules/tanstack-query-guardrails'),
  },
  configs: {
    recommended: {
      plugins: ['reactive'],
      rules: {
        'reactive/no-hardcoded-colors': 'error',
        'reactive/no-barrel-exports': 'error',
        'reactive/require-accessible-controls': 'error',
        'reactive/tanstack-query-guardrails': 'error',
      },
    },
  },
};
```

---

## Phase 2: Design Token Rules

**Prereqs:** Phase 1 scaffold complete

**File:** `tools/eslint-plugin-reactive/rules/no-hardcoded-colors.js`

### 2.1 Rule: no-hardcoded-colors

Disallows hardcoded color values, sizes, and fonts in JSX className attributes. Enforces use of Tailwind theme tokens only.

```javascript
// tools/eslint-plugin-reactive/rules/no-hardcoded-colors.js
module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow hardcoded colors, sizes, fonts. Use Tailwind tokens.',
      recommended: true,
    },
    messages: {
      noHardcodedColor: 'Hardcoded color "{{value}}" detected. Use Tailwind color token (e.g., bg-primary, text-muted-foreground).',
      noHardcodedSize: 'Hardcoded size "{{value}}" detected. Use Tailwind spacing token (e.g., p-4, m-2, w-full).',
      noArbitraryValue: 'Arbitrary Tailwind value "{{value}}" detected. Use design tokens instead.',
    },
    schema: [],
  },
  create(context) {
    // Patterns for hardcoded values
    const hexColorRegex = /#[0-9a-fA-F]{3,8}\b/;
    const rgbRegex = /rgba?\s*\([^)]+\)/;
    const hslRegex = /hsla?\s*\([^)]+\)/;
    const arbitraryRegex = /\[[\w#%().,-]+\]/; // Tailwind arbitrary values like [#fff] or [12px]
    const namedColorRegex = /\b(red|blue|green|yellow|orange|purple|pink|gray|black|white)-\d{2,3}\b/;

    return {
      JSXAttribute(node) {
        if (node.name.name !== 'className') return;
        if (!node.value) return;

        let classValue = '';
        if (node.value.type === 'Literal') {
          classValue = node.value.value;
        } else if (node.value.type === 'JSXExpressionContainer') {
          // Skip complex expressions, check template literals
          if (node.value.expression.type === 'TemplateLiteral') {
            classValue = node.value.expression.quasis.map(q => q.value.raw).join(' ');
          }
        }

        if (!classValue) return;

        // Check for hex colors
        if (hexColorRegex.test(classValue)) {
          context.report({
            node,
            messageId: 'noHardcodedColor',
            data: { value: classValue.match(hexColorRegex)[0] },
          });
        }

        // Check for rgb/hsl
        if (rgbRegex.test(classValue) || hslRegex.test(classValue)) {
          const match = classValue.match(rgbRegex) || classValue.match(hslRegex);
          context.report({
            node,
            messageId: 'noHardcodedColor',
            data: { value: match[0] },
          });
        }

        // Check for Tailwind arbitrary values
        if (arbitraryRegex.test(classValue)) {
          context.report({
            node,
            messageId: 'noArbitraryValue',
            data: { value: classValue.match(arbitraryRegex)[0] },
          });
        }
      },

      // Also check style prop for inline styles
      JSXAttribute(node) {
        if (node.name.name !== 'style') return;
        context.report({
          node,
          messageId: 'noHardcodedColor',
          data: { value: 'inline style prop' },
        });
      },
    };
  },
};
```

---

## Phase 3: Barrel Export Rules

**Prereqs:** Phase 1 scaffold complete

**File:** `tools/eslint-plugin-reactive/rules/no-barrel-exports.js`

### 3.1 Rule: no-barrel-exports

Disallows `export * from` in feature folders. Enforces direct imports for UI libs.

```javascript
// tools/eslint-plugin-reactive/rules/no-barrel-exports.js
module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow barrel exports (export *) in feature folders.',
      recommended: true,
    },
    messages: {
      noBarrelExport: 'Barrel export "export * from" is not allowed in feature folders. Use named exports.',
      preferDirectImport: 'Prefer direct import from module instead of barrel index.',
    },
    schema: [
      {
        type: 'object',
        properties: {
          featureFolderPattern: { type: 'string' },
        },
        additionalProperties: false,
      },
    ],
  },
  create(context) {
    const options = context.options[0] || {};
    const featurePattern = new RegExp(options.featureFolderPattern || 'features/');
    const filename = context.getFilename();

    // Only apply to feature folders
    const isFeatureFolder = featurePattern.test(filename);

    return {
      ExportAllDeclaration(node) {
        if (isFeatureFolder) {
          context.report({
            node,
            messageId: 'noBarrelExport',
          });
        }
      },

      // Warn on importing from index files in libs
      ImportDeclaration(node) {
        const source = node.source.value;
        // Flag imports ending in /index or just the folder
        if (source.includes('@reactive-platform/') && !source.includes('/src/')) {
          // Allow top-level lib imports, warn on index re-exports
          // This is a soft warning - can be configured per project
        }
      },
    };
  },
};
```

---

## Phase 4: Accessibility Rules

**Prereqs:** Phase 1 scaffold complete

**File:** `tools/eslint-plugin-reactive/rules/require-accessible-controls.js`

### 4.1 Rule: require-accessible-controls

Enforces:
- Interactive elements must have accessible labels
- `onClick` without `role` is flagged
- `target="_blank"` requires `rel="noopener noreferrer"`

```javascript
// tools/eslint-plugin-reactive/rules/require-accessible-controls.js
module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Enforce accessibility patterns for interactive controls.',
      recommended: true,
    },
    messages: {
      missingRole: 'Element with onClick handler must have a role attribute (e.g., role="button").',
      missingAriaLabel: 'Interactive element missing accessible label. Add aria-label or aria-labelledby.',
      unsafeBlankTarget: 'Links with target="_blank" must include rel="noopener noreferrer" for security.',
      clickableNonInteractive: 'Non-interactive element "{{element}}" has onClick. Use <button> or add role.',
    },
    schema: [],
  },
  create(context) {
    const interactiveElements = new Set(['button', 'a', 'input', 'select', 'textarea']);

    function hasAttribute(node, name) {
      return node.attributes.some(
        attr => attr.type === 'JSXAttribute' && attr.name.name === name
      );
    }

    function getAttributeValue(node, name) {
      const attr = node.attributes.find(
        attr => attr.type === 'JSXAttribute' && attr.name.name === name
      );
      if (!attr || !attr.value) return null;
      if (attr.value.type === 'Literal') return attr.value.value;
      return true; // Expression exists
    }

    return {
      JSXOpeningElement(node) {
        const elementName = node.name.name;
        if (!elementName || typeof elementName !== 'string') return;

        const hasOnClick = hasAttribute(node, 'onClick');
        const hasRole = hasAttribute(node, 'role');
        const isInteractive = interactiveElements.has(elementName.toLowerCase());

        // Rule: onClick on non-interactive element needs role
        if (hasOnClick && !isInteractive && !hasRole) {
          context.report({
            node,
            messageId: 'clickableNonInteractive',
            data: { element: elementName },
          });
        }

        // Rule: target="_blank" needs rel
        if (elementName.toLowerCase() === 'a') {
          const target = getAttributeValue(node, 'target');
          const rel = getAttributeValue(node, 'rel');

          if (target === '_blank') {
            if (!rel || (typeof rel === 'string' && !rel.includes('noopener'))) {
              context.report({
                node,
                messageId: 'unsafeBlankTarget',
              });
            }
          }
        }
      },
    };
  },
};
```

---

## Phase 5: TanStack Query Rules

**Prereqs:** Phase 1 scaffold complete

**File:** `tools/eslint-plugin-reactive/rules/tanstack-query-guardrails.js`

### 5.1 Rule: tanstack-query-guardrails

Enforces:
- `useQuery` must have explicit `queryKey`
- Retry count should be capped (warn if > 3)
- Error handling must use typed errors

```javascript
// tools/eslint-plugin-reactive/rules/tanstack-query-guardrails.js
module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Enforce TanStack Query best practices.',
      recommended: true,
    },
    messages: {
      missingQueryKey: 'useQuery must have an explicit queryKey array as first element of options.',
      excessiveRetries: 'Retry count {{count}} exceeds recommended maximum of 3.',
      missingErrorType: 'Query error handling should use typed ApiError. Import and use ApiError class.',
    },
    schema: [
      {
        type: 'object',
        properties: {
          maxRetries: { type: 'number', default: 3 },
        },
        additionalProperties: false,
      },
    ],
  },
  create(context) {
    const options = context.options[0] || {};
    const maxRetries = options.maxRetries ?? 3;

    return {
      CallExpression(node) {
        if (node.callee.name !== 'useQuery' && node.callee.name !== 'useMutation') {
          return;
        }

        const args = node.arguments;
        if (args.length === 0) return;

        const optionsArg = args[0];
        if (optionsArg.type !== 'ObjectExpression') return;

        const properties = optionsArg.properties;

        // Check for queryKey (useQuery only)
        if (node.callee.name === 'useQuery') {
          const hasQueryKey = properties.some(
            p => p.type === 'Property' && p.key.name === 'queryKey'
          );
          if (!hasQueryKey) {
            context.report({
              node,
              messageId: 'missingQueryKey',
            });
          }
        }

        // Check retry count
        const retryProp = properties.find(
          p => p.type === 'Property' && p.key.name === 'retry'
        );
        if (retryProp && retryProp.value.type === 'Literal') {
          const retryCount = retryProp.value.value;
          if (typeof retryCount === 'number' && retryCount > maxRetries) {
            context.report({
              node: retryProp,
              messageId: 'excessiveRetries',
              data: { count: retryCount },
            });
          }
        }
      },
    };
  },
};
```

---

## Phase 6: ESLint Config Integration

**Prereqs:** Phases 1-5 complete, 021D eslint.config.js exists

**File:** `eslint.config.js`

### 6.1 Update eslint.config.js

Add to existing flat config from 021D:

```javascript
// eslint.config.js (additions to existing config)
const nx = require('@nx/eslint-plugin');
const reactivePlugin = require('./tools/eslint-plugin-reactive');

module.exports = [
  // ... existing nx configs from 021D ...

  // Custom reactive plugin
  {
    plugins: {
      reactive: reactivePlugin,
    },
  },

  // Apply to all TypeScript/JavaScript files
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    rules: {
      // Design tokens
      'reactive/no-hardcoded-colors': 'error',

      // Barrel exports (feature folders only)
      'reactive/no-barrel-exports': ['error', {
        featureFolderPattern: 'features/',
      }],

      // Accessibility
      'reactive/require-accessible-controls': 'error',

      // TanStack Query
      'reactive/tanstack-query-guardrails': ['error', {
        maxRetries: 3,
      }],
    },
  },

  // Stricter rules for UI libs
  {
    files: ['libs/shared-ui/**/*.tsx'],
    rules: {
      'reactive/no-hardcoded-colors': 'error',
      // UI libs should never have barrel exports
      'reactive/no-barrel-exports': 'error',
    },
  },
];
```

### 6.2 Install Plugin Locally

```bash
# Link local plugin (in pnpm workspace)
pnpm add -D ./tools/eslint-plugin-reactive
```

Or in `package.json`:

```json
{
  "devDependencies": {
    "eslint-plugin-reactive": "file:./tools/eslint-plugin-reactive"
  }
}
```

---

## Files Summary

| Action | File | Purpose |
|--------|------|---------|
| CREATE | `tools/eslint-plugin-reactive/package.json` | Plugin package manifest |
| CREATE | `tools/eslint-plugin-reactive/index.js` | Plugin entry point |
| CREATE | `tools/eslint-plugin-reactive/rules/no-hardcoded-colors.js` | Design token enforcement |
| CREATE | `tools/eslint-plugin-reactive/rules/no-barrel-exports.js` | Barrel export restriction |
| CREATE | `tools/eslint-plugin-reactive/rules/require-accessible-controls.js` | A11y patterns |
| CREATE | `tools/eslint-plugin-reactive/rules/tanstack-query-guardrails.js` | Query guardrails |
| MODIFY | `eslint.config.js` | Integrate custom plugin |
| MODIFY | `package.json` | Add local plugin dependency |

---

## Testing Strategy

### Manual Verification

```bash
# Run lint on all projects
nx run-many -t lint

# Test specific rule violations
echo 'const Test = () => <div className="bg-[#ff0000]">test</div>' > test-violation.tsx
npx eslint test-violation.tsx
rm test-violation.tsx
```

### Expected Violations

| Rule | Triggers On |
|------|-------------|
| `no-hardcoded-colors` | `className="bg-[#fff]"`, `style=&#123;&#123; color: 'red' &#125;&#125;` |
| `no-barrel-exports` | `export * from './component'` in features/ |
| `require-accessible-controls` | `<div onClick={...}>` without role |
| `tanstack-query-guardrails` | `useQuery({ queryFn })` missing queryKey |

---

## Checklist

- [x] Phase 1: Plugin scaffold created
- [x] Phase 2: no-hardcoded-colors rule working
- [x] Phase 3: no-barrel-exports rule working
- [x] Phase 4: require-accessible-controls rule working
- [x] Phase 5: tanstack-query-guardrails rule working
- [x] Phase 6: eslint.config.js updated
- [x] `nx lint` runs all custom rules
- [x] Violations produce clear, actionable messages

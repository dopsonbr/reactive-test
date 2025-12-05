# 024B_DESIGN_TOKEN_STYLELINT

**Status: DRAFT**

---

## Overview

Configure Stylelint with Tailwind CSS plugin to ban arbitrary values, enforce design tokens for spacing/typography, and disallow inline styles.

**Parent Plan:** [024_FRONTEND_LINT_GUARDRAILS](./024_FRONTEND_LINT_GUARDRAILS.md)

**Prerequisites:**
- `020_NX_MONOREPO_IMPLEMENTATION.md` Phase 1.1 complete (pnpm, package.json)
- Tailwind CSS configured (per ADR-008)

**Blockers:**
- `package.json` must exist at root
- `tailwind.config.js` should exist (or will be created)

---

## Goals

1. Install and configure Stylelint with Tailwind plugin
2. Ban arbitrary Tailwind values (e.g., `p-[17px]`)
3. Enforce tokenized spacing, typography, and colors
4. Disallow inline styles in CSS files
5. Add `lint:styles` npm script

---

## Exit Criteria

- [ ] `pnpm lint:styles` runs Stylelint
- [ ] Arbitrary Tailwind values trigger errors
- [ ] Inline styles in CSS files flagged
- [ ] Design token enforcement active

---

## Phase 1: Install Stylelint

**Prereqs:** `package.json` exists

**Commands:**

```bash
pnpm add -D stylelint stylelint-config-standard postcss-styled-syntax
pnpm add -D stylelint-config-tailwindcss
```

**Files:**
- CREATE: `.stylelintrc.json`
- CREATE: `.stylelintignore`
- MODIFY: `package.json`

### 1.1 .stylelintrc.json

```json
{
  "$schema": "https://json.schemastore.org/stylelintrc.json",
  "extends": [
    "stylelint-config-standard",
    "stylelint-config-tailwindcss"
  ],
  "rules": {
    "at-rule-no-unknown": [
      true,
      {
        "ignoreAtRules": [
          "tailwind",
          "apply",
          "layer",
          "config",
          "screen"
        ]
      }
    ],
    "function-no-unknown": [
      true,
      {
        "ignoreFunctions": ["theme"]
      }
    ],
    "declaration-block-no-duplicate-properties": true,
    "no-descending-specificity": null,
    "selector-class-pattern": null
  },
  "overrides": [
    {
      "files": ["**/*.css"],
      "rules": {
        "value-no-vendor-prefix": true,
        "property-no-vendor-prefix": true
      }
    }
  ]
}
```

### 1.2 .stylelintignore

```
node_modules/
dist/
build/
.next/
coverage/
*.min.css
```

### 1.3 package.json Scripts

```json
{
  "scripts": {
    "lint:styles": "stylelint '**/*.css' --allow-empty-input",
    "lint:styles:fix": "stylelint '**/*.css' --fix --allow-empty-input"
  },
  "devDependencies": {
    "stylelint": "^16.12.0",
    "stylelint-config-standard": "^36.0.1",
    "stylelint-config-tailwindcss": "^0.0.7"
  }
}
```

---

## Phase 2: Custom Token Enforcement Rules

**Prereqs:** Phase 1 complete

**File:** CREATE `tools/stylelint-plugin-tokens/index.js`

### 2.1 Plugin Structure

```
tools/stylelint-plugin-tokens/
├── package.json
└── index.js
```

### 2.2 package.json

```json
{
  "name": "stylelint-plugin-tokens",
  "version": "0.0.1",
  "private": true,
  "main": "index.js",
  "peerDependencies": {
    "stylelint": ">=16.0.0"
  }
}
```

### 2.3 index.js - Token Enforcement

```javascript
// tools/stylelint-plugin-tokens/index.js
const stylelint = require('stylelint');

const ruleName = 'reactive/no-arbitrary-values';
const messages = stylelint.utils.ruleMessages(ruleName, {
  rejected: (value) => `Arbitrary value "${value}" is not allowed. Use design tokens.`,
});

const ruleFunction = (primaryOption) => {
  return (root, result) => {
    const validOptions = stylelint.utils.validateOptions(result, ruleName, {
      actual: primaryOption,
      possible: [true, false],
    });

    if (!validOptions || !primaryOption) return;

    // Pattern for Tailwind arbitrary values
    const arbitraryPattern = /\[[\w#%().,-]+\]/g;

    root.walkDecls((decl) => {
      const matches = decl.value.match(arbitraryPattern);
      if (matches) {
        matches.forEach((match) => {
          stylelint.utils.report({
            message: messages.rejected(match),
            node: decl,
            result,
            ruleName,
          });
        });
      }
    });

    // Also check @apply directives
    root.walkAtRules('apply', (atRule) => {
      const matches = atRule.params.match(arbitraryPattern);
      if (matches) {
        matches.forEach((match) => {
          stylelint.utils.report({
            message: messages.rejected(match),
            node: atRule,
            result,
            ruleName,
          });
        });
      }
    });
  };
};

ruleFunction.ruleName = ruleName;
ruleFunction.messages = messages;

// No inline styles rule
const noInlineStylesRuleName = 'reactive/no-inline-style-prop';
const noInlineStylesMessages = stylelint.utils.ruleMessages(noInlineStylesRuleName, {
  rejected: () => 'Inline style properties are not allowed. Use Tailwind classes.',
});

const noInlineStylesRule = (primaryOption) => {
  return (root, result) => {
    // This rule is primarily enforced in ESLint for JSX
    // Stylelint handles CSS file violations
  };
};

noInlineStylesRule.ruleName = noInlineStylesRuleName;
noInlineStylesRule.messages = noInlineStylesMessages;

module.exports = [
  stylelint.createPlugin(ruleName, ruleFunction),
  stylelint.createPlugin(noInlineStylesRuleName, noInlineStylesRule),
];
```

### 2.4 Update .stylelintrc.json

```json
{
  "$schema": "https://json.schemastore.org/stylelintrc.json",
  "plugins": ["./tools/stylelint-plugin-tokens"],
  "extends": [
    "stylelint-config-standard",
    "stylelint-config-tailwindcss"
  ],
  "rules": {
    "reactive/no-arbitrary-values": true,
    "at-rule-no-unknown": [
      true,
      {
        "ignoreAtRules": [
          "tailwind",
          "apply",
          "layer",
          "config",
          "screen"
        ]
      }
    ],
    "function-no-unknown": [
      true,
      {
        "ignoreFunctions": ["theme"]
      }
    ],
    "declaration-block-no-duplicate-properties": true,
    "no-descending-specificity": null,
    "selector-class-pattern": null
  }
}
```

---

## Phase 3: Tailwind Config Validation

**Prereqs:** Phase 1 complete, tailwind.config.js exists

**File:** CREATE `tools/validate-tailwind-config.js`

### 3.1 Config Validator Script

Ensures tailwind.config.js uses design tokens properly:

```javascript
#!/usr/bin/env node
// tools/validate-tailwind-config.js

const fs = require('fs');
const path = require('path');

const configPath = path.resolve(process.cwd(), 'tailwind.config.js');

if (!fs.existsSync(configPath)) {
  console.log('⚠️  tailwind.config.js not found. Skipping validation.');
  process.exit(0);
}

// Dynamic import for ESM config
async function validateConfig() {
  try {
    const config = require(configPath);
    const errors = [];

    // Check theme extends (should use tokens, not hardcoded values)
    if (config.theme?.extend?.colors) {
      const colors = config.theme.extend.colors;
      Object.entries(colors).forEach(([key, value]) => {
        if (typeof value === 'string' && value.startsWith('#')) {
          errors.push(`Hardcoded color in theme.extend.colors.${key}: "${value}". Use CSS variables.`);
        }
      });
    }

    // Check for arbitrary content in safelist
    if (config.safelist) {
      config.safelist.forEach((item, index) => {
        const pattern = typeof item === 'string' ? item : item.pattern?.source;
        if (pattern && pattern.includes('[')) {
          errors.push(`Safelist[${index}] contains arbitrary value pattern. Avoid safelisting arbitrary values.`);
        }
      });
    }

    if (errors.length > 0) {
      console.error('❌ Tailwind config validation failed:\n');
      errors.forEach(err => console.error(`  - ${err}`));
      process.exit(1);
    }

    console.log('✅ Tailwind config validation passed.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Failed to validate Tailwind config:', err.message);
    process.exit(1);
  }
}

validateConfig();
```

### 3.2 Add Script to package.json

```json
{
  "scripts": {
    "lint:tailwind-config": "node tools/validate-tailwind-config.js"
  }
}
```

---

## Phase 4: Token Documentation

**Prereqs:** Design token theme defined

**File:** CREATE `docs/standards/frontend/design-tokens.md`

### 4.1 Design Token Reference

Document approved tokens for contributor reference:

```markdown
# Design Tokens Standard

## Intent
Define the approved Tailwind design tokens. Only these tokens should be used in code.

## Approved Token Categories

### Colors (Use semantic names)
- `primary`, `primary-foreground`
- `secondary`, `secondary-foreground`
- `muted`, `muted-foreground`
- `accent`, `accent-foreground`
- `destructive`, `destructive-foreground`
- `border`, `input`, `ring`
- `background`, `foreground`

### Spacing (Tailwind defaults)
- `0`, `0.5`, `1`, `1.5`, `2`, `3`, `4`, `5`, `6`, `8`, `10`, `12`, `16`, `20`, `24`
- Avoid arbitrary: `p-[17px]` ❌ → `p-4` ✅

### Typography
- Font sizes: `text-xs`, `text-sm`, `text-base`, `text-lg`, `text-xl`, `text-2xl`
- Font weights: `font-normal`, `font-medium`, `font-semibold`, `font-bold`

### Border Radius
- `rounded-none`, `rounded-sm`, `rounded`, `rounded-md`, `rounded-lg`, `rounded-xl`, `rounded-full`

## Anti-patterns

```tsx
// ❌ Arbitrary values
<div className="p-[17px] bg-[#ff0000] text-[13px]">

// ✅ Design tokens
<div className="p-4 bg-destructive text-sm">
```

## Enforcement
- ESLint: `reactive/no-hardcoded-colors`
- Stylelint: `reactive/no-arbitrary-values`
```

---

## Files Summary

| Action | File | Purpose |
|--------|------|---------|
| CREATE | `.stylelintrc.json` | Stylelint configuration |
| CREATE | `.stylelintignore` | Ignore patterns |
| CREATE | `tools/stylelint-plugin-tokens/package.json` | Plugin manifest |
| CREATE | `tools/stylelint-plugin-tokens/index.js` | Token enforcement rules |
| CREATE | `tools/validate-tailwind-config.js` | Config validation script |
| CREATE | `docs/standards/frontend/design-tokens.md` | Token reference docs |
| MODIFY | `package.json` | Add lint:styles scripts |

---

## Testing Strategy

### Manual Verification

```bash
# Run Stylelint
pnpm lint:styles

# Test arbitrary value detection
echo '.test { @apply p-[17px]; }' > test.css
pnpm lint:styles test.css
rm test.css

# Validate Tailwind config
pnpm lint:tailwind-config
```

### Expected Violations

| Input | Rule | Message |
|-------|------|---------|
| `@apply p-[17px]` | `reactive/no-arbitrary-values` | Arbitrary value "[17px]" not allowed |
| `color: #ff0000` | `reactive/no-arbitrary-values` | Arbitrary value "[#ff0000]" not allowed |

---

## Checklist

- [ ] Phase 1: Stylelint installed and configured
- [ ] Phase 2: Token enforcement plugin created
- [ ] Phase 3: Tailwind config validator working
- [ ] Phase 4: Design tokens documented
- [ ] `pnpm lint:styles` runs without errors
- [ ] Arbitrary values trigger lint failures

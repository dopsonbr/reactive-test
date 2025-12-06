# tools/

Development tools, custom plugins, and scripts for the reactive-platform monorepo.

> **Note:** All standalone scripts use ESM (`.mjs` extension) and require Node.js 24.x.

## Directory Structure

```
tools/
├── eslint-plugin-reactive/    # Custom ESLint rules
├── stylelint-plugin-tokens/   # Custom Stylelint rules
├── src/                       # Nx workspace plugin generators
├── openapi-codegen/           # API client generation
├── check-frontend.sh          # Frontend check suite
├── check-service-ports.mjs    # Docker port verification
├── validate-tailwind-config.mjs # Tailwind config validation
├── lint-stories.ts            # UI component story/a11y enforcement
├── lint-tests.ts              # Feature test co-location enforcement
└── verify-docs-index.sh       # Documentation index verification
```

## Nx Workspace Plugin

Custom Nx generators for scaffolding components.

### ui-component Generator

Scaffolds a new UI component with:
- Component file with CVA variants
- Test file with axe-core accessibility tests
- Ladle story file
- Automatic export in index.ts

**Usage:**

```bash
# Basic usage
pnpm nx g @reactive-platform/workspace-plugin:ui-component Alert

# With options
pnpm nx g @reactive-platform/workspace-plugin:ui-component Alert \
  --description="Alert notification component" \
  --category=components

# Dry run (preview changes)
pnpm nx g @reactive-platform/workspace-plugin:ui-component Alert --dry-run
```

**Options:**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `name` | string | required | Component name (PascalCase) |
| `description` | string | - | Component description for stories |
| `withStory` | boolean | true | Generate Ladle story |
| `withTest` | boolean | true | Generate test file |
| `category` | string | components | Story category |

## ESLint Plugin (`eslint-plugin-reactive`)

Custom ESLint rules for frontend guardrails. Uses ESM.

### Rules

| Rule | Severity | Description |
|------|----------|-------------|
| `reactive/no-hardcoded-colors` | warn | Disallow hardcoded hex/rgb colors; use design tokens |
| `reactive/no-barrel-exports` | error | Disallow barrel exports in feature folders |
| `reactive/require-accessible-controls` | warn | Require aria-label on interactive elements |
| `reactive/tanstack-query-guardrails` | error | Enforce staleTime, max retries, error boundaries |
| `reactive/require-colocated-test` | warn | Warn when feature files lack co-located tests |

**Configuration:** See `eslint.config.mjs` in project root.

## Stylelint Plugin (`stylelint-plugin-tokens`)

Custom Stylelint rule for design token enforcement. Uses ESM.

### Rules

| Rule | Description |
|------|-------------|
| `reactive/no-arbitrary-values` | Disallow Tailwind arbitrary values like `[#fff]` |

**Configuration:** See `.stylelintrc.json` in project root.

## Standalone Scripts

### check-frontend.sh

Comprehensive frontend check suite for pre-PR validation.

```bash
./tools/check-frontend.sh          # Full check
./tools/check-frontend.sh --quick  # Skip tests
./tools/check-frontend.sh --graph  # Include project graph validation
```

**Phases:**
1. Environment validation (Node 24.x, pnpm, Nx)
2. Project graph validation (optional)
3. ESLint (module boundaries + custom rules)
4. Stylelint (design tokens)
5. Story/a11y/test coverage
6. Tests (skippable with --quick)

### check-service-ports.mjs

Verifies Docker Compose service ports match expected configuration.

```bash
node tools/check-service-ports.mjs
```

Uses `expected-ports.json` as source of truth.

### validate-tailwind-config.mjs

Validates Tailwind config follows design token conventions.

```bash
node tools/validate-tailwind-config.mjs
```

**Checks:**
- No hardcoded hex colors in theme.extend.colors
- No arbitrary values in safelist patterns

### lint-stories.ts

Enforces story and accessibility test coverage for UI components.

```bash
pnpm lint:stories  # Check story coverage
pnpm lint:a11y     # Check a11y test coverage
pnpm lint:ui       # Check both
```

### lint-tests.ts

Enforces test co-location for feature files.

```bash
pnpm lint:tests
```

### verify-docs-index.sh

Verifies documentation index is up to date.

```bash
pnpm check:docs-index
```

## Development

### Build the Workspace Plugin

```bash
pnpm nx build tools
```

### Test the Workspace Plugin

```bash
pnpm nx test tools
```

### Adding New Generators

1. Generate scaffold:
   ```bash
   pnpm nx g @nx/plugin:generator new-generator --path=tools/src/generators/new-generator
   ```

2. Implement in `new-generator.ts`

3. Add template files in `files/` directory

4. Update `generators.json`

5. Build and test:
   ```bash
   pnpm nx build tools
   pnpm nx g @reactive-platform/workspace-plugin:new-generator --dry-run
   ```

### Adding New ESLint Rules

1. Create rule file in `eslint-plugin-reactive/rules/`:
   ```javascript
   // my-rule.js (ESM)
   export default {
     meta: { type: 'problem', docs: {...}, schema: [] },
     create(context) { ... }
   };
   ```

2. Export from `eslint-plugin-reactive/index.js`

3. Configure in `eslint.config.mjs`

### Adding New Stylelint Rules

1. Add rule function in `stylelint-plugin-tokens/index.js`

2. Export using `stylelint.createPlugin()`

3. Configure in `.stylelintrc.json`

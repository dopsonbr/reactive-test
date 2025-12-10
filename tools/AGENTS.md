# AGENTS.md - tools/

Guidance for AI agents working with the tools directory.

## Quick Reference

| Tool | Command | Purpose |
|------|---------|---------|
| Frontend checks | `./tools/check-frontend.sh` | Pre-PR validation suite |
| Port verification | `node tools/check-service-ports.mjs` | Verify Docker ports |
| Tailwind validation | `node tools/validate-tailwind-config.mjs` | Check design tokens |
| UI component generator | `pnpm nx g @reactive-platform/workspace-plugin:ui-component Name` | Scaffold component |

## Key Constraints

### Node.js Version
- **Required:** Node.js 24.x (enforced by `scripts/setup-node.mjs`)
- All `.js`/`.mjs` scripts run as ESM because the repo root `package.json` sets `"type": "module"`
- The workspace plugin (`tools/package.json`) uses CommonJS for Nx compatibility

### ESM vs CommonJS
- Standalone scripts: ESM (`.js` extension preferred)
- `eslint-plugin-reactive/`: ESM (`"type": "module"` in its package.json)
- `stylelint-plugin-tokens/`: ESM (`"type": "module"` in its package.json)
- `tools/src/` (Nx plugin): CommonJS (compiled from TypeScript)

## When Modifying Tools

### Adding a New ESLint Rule

1. Create `tools/eslint-plugin-reactive/rules/my-rule.js`:
   ```javascript
   export default {
     meta: {
       type: 'problem',
       docs: { description: '...', recommended: true },
       schema: [],
     },
     create(context) {
       return {
         // AST visitors
       };
     },
   };
   ```

2. Add to `tools/eslint-plugin-reactive/index.js`:
   ```javascript
   import myRule from './rules/my-rule.js';
   // Add to rules object and recommended config
   ```

3. Configure in root `eslint.config.mjs`

### Adding a New Standalone Script

1. Use `.js` extension for ESM (thanks to repo-level `type: module`)
2. Add shebang: `#!/usr/bin/env node`
3. Use `node:` prefix for built-ins: `import fs from 'node:fs'`
4. For `__dirname` equivalent:
   ```javascript
   import { fileURLToPath } from 'node:url';
   import path from 'node:path';
   const __dirname = path.dirname(fileURLToPath(import.meta.url));
   ```

### Adding a New Generator

1. Use Nx generator scaffold:
   ```bash
   pnpm nx g @nx/plugin:generator my-generator --path=tools/src/generators/my-generator
   ```
2. Implement in TypeScript
3. Update `tools/generators.json`

## Common Issues

### "Cannot use import statement outside a module"
- Ensure file has `.mjs` extension, OR
- Ensure the containing package.json has `"type": "module"`

### ESLint plugin not loading
- Check `eslint.config.mjs` imports the plugin correctly
- Verify `tools/eslint-plugin-reactive/package.json` has `"type": "module"`

### Script fails on Node version
- Run `node -v` to verify Node 24.x
- Use `nvm use 24` or install Node 24

## File Purposes

| File | Purpose |
|------|---------|
| `check-frontend.sh` | Orchestrates all frontend checks (lint, test, coverage) |
| `check-service-ports.mjs` | Validates Docker Compose ports match `expected-ports.json` |
| `validate-tailwind-config.mjs` | Ensures Tailwind config uses CSS variables, not hardcoded colors |
| `lint-stories.ts` | Checks UI components have Ladle stories and a11y tests |
| `lint-tests.ts` | Checks feature files have co-located test files |
| `expected-ports.json` | Source of truth for service port assignments |
| `generators.json` | Nx generator registration |
| `eslint.config.mjs` | ESLint config for the tools project itself |

## Testing Changes

```bash
# Lint the tools project
pnpm nx lint tools

# Build workspace plugin
pnpm nx build tools

# Test workspace plugin
pnpm nx test tools

# Verify scripts work
node tools/check-service-ports.mjs
node tools/validate-tailwind-config.mjs
```

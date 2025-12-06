# @reactive-platform/workspace-plugin

Custom Nx workspace plugin with generators for the reactive-platform monorepo.

## Generators

### ui-component

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

# Without story
pnpm nx g @reactive-platform/workspace-plugin:ui-component Spinner --withStory=false

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
| `category` | string | components | Story category (foundations, components, patterns) |

## Development

### Build

```bash
pnpm nx build tools
```

### Test

```bash
pnpm nx test tools
```

## Adding New Generators

1. Generate the generator scaffold:
   ```bash
   pnpm nx g @nx/plugin:generator new-generator --path=tools/src/generators/new-generator
   ```

2. Implement the generator in `new-generator.ts`

3. Add template files in `files/` directory

4. Update `generators.json` with the new generator entry

5. Build and test:
   ```bash
   pnpm nx build tools
   pnpm nx g @reactive-platform/workspace-plugin:new-generator --dry-run
   ```

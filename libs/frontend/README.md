# Frontend Libraries

TypeScript/React libraries for the reactive platform frontend applications.

## Structure

- `shared-ui/` - Reusable UI components (React + shadcn/ui)
- `shared-data/` - Data access libraries (API client, generated types)
- `shared-design/` - Design system tokens (CSS variables)

## Usage

```typescript
import { Button } from '@reactive-platform/shared-ui-components';
import { ProductApi } from '@reactive-platform/api-client';
import '@reactive-platform/shared-design-tokens';
```

## Libraries

| Library | Purpose |
|---------|---------|
| `shared-design/tokens` | Design tokens (CSS variables for colors, spacing, typography) |
| `shared-ui/ui-components` | shadcn/ui components with Tailwind CSS and CVA |
| `shared-data/api-client` | Generated TypeScript API client from OpenAPI |

## Development

```bash
# Build UI components
pnpm nx build ui-components

# Run component tests
pnpm nx test ui-components

# Launch Ladle (component stories)
pnpm nx ladle ui-components

# Generate new UI component
pnpm nx g @reactive-platform/workspace-plugin:ui-component ComponentName

# Generate API client (requires product-service running)
pnpm generate:api
```

## TypeScript Path Aliases

Configured in `tsconfig.base.json`:

| Alias | Path |
|-------|------|
| `@reactive-platform/shared-ui-components` | `libs/frontend/shared-ui/ui-components/src/index.ts` |
| `@reactive-platform/api-client` | `libs/frontend/shared-data/api-client/src/index.ts` |
| `@reactive-platform/shared-design-tokens` | `libs/frontend/shared-design/tokens/src/index.css` |

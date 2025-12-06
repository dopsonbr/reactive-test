# Frontend Libraries - AI Agent Guidance

## Overview

This tier contains all TypeScript/React frontend libraries including UI components, data access, and design tokens.

## Key Directories

- `shared-ui/ui-components/` - Reusable React components built with shadcn/ui patterns
- `shared-data/api-client/` - Generated TypeScript API client from OpenAPI specs
- `shared-design/tokens/` - CSS custom properties for theming

## Import Patterns

```typescript
// UI Components
import { Button, Card } from '@reactive-platform/shared-ui-components';

// API Client
import { ProductApi, Configuration } from '@reactive-platform/api-client';

// Design Tokens (import for side effects)
import '@reactive-platform/shared-design-tokens';
```

## Component Development Guidelines

1. Use CVA (class-variance-authority) for component variants
2. Follow shadcn/ui patterns for component structure
3. Create Ladle stories for visual testing
4. Include accessibility tests using axe-core

## Nested AGENTS.md Files

Check component-specific guidance:
- `shared-ui/ui-components/AGENTS.md` - Component development patterns
- `shared-design/tokens/AGENTS.md` - Token naming conventions

## Commands

```bash
# Generate new component with story and test
pnpm nx g @reactive-platform/workspace-plugin:ui-component Button

# Run story development server
pnpm nx ladle ui-components

# Run component tests
pnpm nx test ui-components
```

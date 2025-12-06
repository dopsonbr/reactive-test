# 021C_FRONTEND_TEMPLATES

**Status: COMPLETE**

---

## Overview

Create 6 frontend code templates for feature components, UI components, hooks, pages, Ladle stories, and Vitest tests.

**Parent Plan:** [021_FRONTEND_STANDARDS_INITIATIVE](./021_FRONTEND_STANDARDS_INITIATIVE.md)

**Prerequisites:**
- [021B_FRONTEND_STANDARDS](./021B_FRONTEND_STANDARDS.md) complete (standards to reference exist)

**Blockers:**
- None

**Related ADRs:**
- `docs/ADRs/007_frontend_ui_framework.md` - React + Vite + TanStack
- `docs/ADRs/008_component_library_design_system.md` - shadcn/ui + Tailwind + CVA
- `docs/ADRs/009_frontend_testing_strategy.md` - Ladle + Vitest

---

## Goals

1. Create 6 frontend templates following ADR patterns
2. Include CVA common mistakes in UI component template
3. Update `docs/templates/README.md` index

---

## Exit Criteria

- [x] 6 frontend templates in `docs/templates/frontend/`
- [x] UI component template includes CVA guidance
- [x] `docs/templates/README.md` indexes all templates
- [x] `pnpm check:docs-index` passes

---

## Phase 1: Feature Component Template

**File:** `docs/templates/frontend/_template_feature_component.md`

**Content:**
```markdown
# Feature Component Template

## Usage
For smart/container components with data fetching and business logic.

## Structure
// features/{domain}/components/{ComponentName}.tsx
import { useQuery, useMutation } from '@tanstack/react-query';

interface {ComponentName}Props {
  id: string;
}

export function {ComponentName}({ id }: {ComponentName}Props) {
  const { data, isLoading, isError, error } = use{Domain}Query(id);
  const mutation = use{Domain}Mutation();

  if (isLoading) return <{ComponentName}Skeleton />;
  if (isError) return <ErrorCard error={error} onRetry={() => refetch()} />;

  return (
    <div>
      <{Domain}Card data={data} onAction={mutation.mutate} />
    </div>
  );
}

## Co-located Files
features/{domain}/components/
├── {ComponentName}.tsx
├── {ComponentName}.test.tsx    # Vitest + RTL
└── {ComponentName}.stories.tsx # Optional
```

---

## Phase 2: UI Component Template

**File:** `docs/templates/frontend/_template_ui_component.md`

**Content:**
```markdown
# UI Component Template

## Usage
For presentational/dumb components in libs/shared-ui.

## Structure
// libs/shared-ui/{component}/src/{component}.tsx
import { cn } from '@/lib/utils';
import { type VariantProps, cva } from 'class-variance-authority';

const componentVariants = cva(
  'base-classes-here',
  {
    variants: {
      variant: {
        default: 'variant-default-classes',
        secondary: 'variant-secondary-classes',
      },
      size: {
        sm: 'size-sm-classes',
        md: 'size-md-classes',
        lg: 'size-lg-classes',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

interface {Component}Props
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof componentVariants> {}

export function {Component}({
  className,
  variant,
  size,
  ...props
}: {Component}Props) {
  return (
    <div
      className={cn(componentVariants({ variant, size }), className)}
      {...props}
    />
  );
}

## Required Files
libs/shared-ui/{component}/
├── src/
│   ├── {component}.tsx
│   ├── {component}.stories.tsx  # Required
│   └── {component}.a11y.test.tsx # Required
├── project.json
└── index.ts

## CVA Common Mistakes

### Missing VariantProps for type inference
// WRONG: variant/size props won't be typed
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';  // Manual duplication = drift
}

// CORRECT: Extract types from cva definition
interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

### Not using cn() for class merging
// WRONG: className prop conflicts with variant classes
className={buttonVariants({ variant, size })}

// CORRECT: Use cn() (tailwind-merge) to resolve conflicts
className={cn(buttonVariants({ variant, size }), className)}

### Overusing CVA for simple components
// WRONG: CVA overhead for non-variant component
const cardVariants = cva('rounded-lg border p-4');
<div className={cardVariants()} />

// CORRECT: Just use classes directly
<div className="rounded-lg border p-4" />

### Forgetting defaultVariants
// WRONG: Requires variant prop on every usage
const buttonVariants = cva('...', {
  variants: { variant: { primary: '...', secondary: '...' } },
});

// CORRECT: Provide sensible defaults
const buttonVariants = cva('...', {
  variants: { variant: { primary: '...', secondary: '...' } },
  defaultVariants: { variant: 'primary' },
});
```

---

## Phase 3: Hook Template

**File:** `docs/templates/frontend/_template_hook.md`

**Content:**
```markdown
# Custom Hook Template

## Usage
For extracting reusable logic from components.

## Structure
// hooks/use{HookName}.ts
import { useState, useCallback } from 'react';

interface Use{HookName}Options {
  initialValue?: string;
  onSuccess?: (result: Result) => void;
}

interface Use{HookName}Return {
  value: string;
  isLoading: boolean;
  error: Error | null;
  execute: (input: Input) => Promise<void>;
  reset: () => void;
}

export function use{HookName}(options: Use{HookName}Options = {}): Use{HookName}Return {
  const { initialValue = '', onSuccess } = options;
  const [value, setValue] = useState(initialValue);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const execute = useCallback(async (input: Input) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await doSomething(input);
      setValue(result);
      onSuccess?.(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoading(false);
    }
  }, [onSuccess]);

  const reset = useCallback(() => {
    setValue(initialValue);
    setError(null);
  }, [initialValue]);

  return { value, isLoading, error, execute, reset };
}

## Rules
- Return object with named properties (not tuple)
- Include cleanup in useEffect hooks
- Memoize callbacks with useCallback
- Accept options object for configurability

## Co-located Files
hooks/
├── use{HookName}.ts
└── use{HookName}.test.ts  # Required
```

---

## Phase 4: Page Template

**File:** `docs/templates/frontend/_template_page.md`

**Content:**
```markdown
# Page/Route Component Template

## Usage
For route-level components that compose features.

## Structure
// pages/{PageName}Page.tsx
import { createFileRoute } from '@tanstack/react-router';
import { ErrorBoundary } from 'react-error-boundary';
import { PageErrorFallback } from '@/components/common/PageErrorFallback';

export const Route = createFileRoute('/{path}')({
  component: {PageName}Page,
  loader: async ({ params }) => {
    await queryClient.ensureQueryData(use{Feature}QueryOptions(params.id));
    return null;
  },
  validateSearch: (search) => ({
    page: Number(search.page) || 1,
    filter: String(search.filter) || '',
  }),
});

function {PageName}Page() {
  const params = Route.useParams();
  const search = Route.useSearch();

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">{Page Title}</h1>
      <ErrorBoundary FallbackComponent={PageErrorFallback}>
        <{Feature}Section id={params.id} page={search.page} />
      </ErrorBoundary>
    </div>
  );
}

## Rules
- Pages are thin orchestrators - delegate to feature components
- Wrap sections in ErrorBoundary for graceful degradation
- Use route loader for critical data
- Keep pages in features/{domain}/pages/

## Co-located Files
features/{domain}/pages/
├── {PageName}Page.tsx
└── {PageName}Page.test.tsx
```

---

## Phase 5: Ladle Story Template

**File:** `docs/templates/frontend/_template_ladle_story.md`

**Content:**
```markdown
# Ladle Story Template

## Usage
For documenting and visually testing UI components.

## Structure
// {component}.stories.tsx
import type { Story } from '@ladle/react';
import { {Component} } from './{component}';

export default {
  title: '{Category}/{Component}',
};

export const Default: Story = () => (
  <{Component}>Default content</{Component}>
);

export const WithVariants: Story = () => (
  <div className="flex flex-col gap-4">
    <{Component} variant="primary">Primary</{Component}>
    <{Component} variant="secondary">Secondary</{Component}>
  </div>
);

export const Sizes: Story = () => (
  <div className="flex items-center gap-4">
    <{Component} size="sm">Small</{Component}>
    <{Component} size="md">Medium</{Component}>
    <{Component} size="lg">Large</{Component}>
  </div>
);

export const States: Story = () => (
  <div className="flex flex-col gap-4">
    <{Component} disabled>Disabled</{Component}>
    <{Component} loading>Loading</{Component}>
  </div>
);

// Interactive with args
export const Interactive: Story<{Component}Props> = ({ variant, size, children }) => (
  <{Component} variant={variant} size={size}>{children}</{Component}>
);
Interactive.args = {
  variant: 'primary',
  size: 'md',
  children: 'Interactive Button',
};

## Rules
- One story file per component
- Cover all variants, sizes, states
- Use descriptive story names
```

---

## Phase 6: Vitest Test Template

**File:** `docs/templates/frontend/_template_vitest.md`

**Content:**
```markdown
# Vitest Test Template

## Usage
For unit and integration tests with React Testing Library.

## Structure
// {component}.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { {Component} } from './{component}';

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

function TestWrapper({ children }: { children: React.ReactNode }) {
  const queryClient = createTestQueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

describe('{Component}', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders with default props', () => {
    render(<{Component}>Content</{Component}>);
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('handles user interaction', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    render(<{Component} onClick={handleClick}>Click me</{Component}>);
    await user.click(screen.getByRole('button', { name: /click me/i }));
    expect(handleClick).toHaveBeenCalledOnce();
  });

  it('fetches and displays data', async () => {
    render(
      <TestWrapper>
        <{Component} id="123" />
      </TestWrapper>
    );
    await waitFor(() => {
      expect(screen.getByText('Expected Content')).toBeInTheDocument();
    });
  });
});

## Rules
- Use describe blocks to group related tests
- Use userEvent over fireEvent
- Await async operations with waitFor
- Mock external dependencies with vi.mock
```

---

## Phase 7: Update Index

**File:** `docs/templates/README.md`

Update to include frontend templates section:

```markdown
## Frontend Templates

| Template | Usage |
|----------|-------|
| [_template_feature_component.md](./frontend/_template_feature_component.md) | Smart components with data fetching |
| [_template_ui_component.md](./frontend/_template_ui_component.md) | Presentational components with CVA |
| [_template_hook.md](./frontend/_template_hook.md) | Custom React hooks |
| [_template_page.md](./frontend/_template_page.md) | TanStack Router pages |
| [_template_ladle_story.md](./frontend/_template_ladle_story.md) | Ladle component stories |
| [_template_vitest.md](./frontend/_template_vitest.md) | Vitest + RTL tests |
```

---

## Files Summary

| Action | File | Purpose |
|--------|------|---------|
| CREATE | `docs/templates/frontend/_template_feature_component.md` | Smart component |
| CREATE | `docs/templates/frontend/_template_ui_component.md` | Presentational + CVA |
| CREATE | `docs/templates/frontend/_template_hook.md` | Custom hooks |
| CREATE | `docs/templates/frontend/_template_page.md` | Route pages |
| CREATE | `docs/templates/frontend/_template_ladle_story.md` | Ladle stories |
| CREATE | `docs/templates/frontend/_template_vitest.md` | Vitest tests |
| MODIFY | `docs/templates/README.md` | Index frontend templates |

---

## Checklist

- [x] Phase 1: Feature component template created
- [x] Phase 2: UI component template created (with CVA guidance)
- [x] Phase 3: Hook template created
- [x] Phase 4: Page template created
- [x] Phase 5: Ladle story template created
- [x] Phase 6: Vitest test template created
- [x] Phase 7: README.md indexes all templates
- [x] `pnpm check:docs-index` passes

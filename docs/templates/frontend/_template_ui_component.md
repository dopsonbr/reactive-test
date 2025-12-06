# UI Component Template

## Usage

For presentational/dumb components in libs/shared-ui.

## Structure

```tsx
// libs/shared-ui/{component}/src/{component}.tsx
import { cn } from '@/lib/utils';
import { type VariantProps, cva } from 'class-variance-authority';
import { forwardRef } from 'react';

const {component}Variants = cva(
  // Base classes applied to all variants
  'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
      },
      size: {
        sm: 'h-8 px-3 text-xs',
        md: 'h-10 px-4 text-sm',
        lg: 'h-12 px-6 text-base',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

interface {Component}Props
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof {component}Variants> {
  isLoading?: boolean;
}

const {Component} = forwardRef<HTMLButtonElement, {Component}Props>(
  ({ className, variant, size, isLoading, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn({component}Variants({ variant, size }), className)}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? <Spinner className="mr-2" /> : null}
        {children}
      </button>
    );
  }
);

{Component}.displayName = '{Component}';

export { {Component}, {component}Variants };
export type { {Component}Props };
```

## Required Files

```
libs/shared-ui/{component}/
├── src/
│   ├── {component}.tsx
│   ├── {component}.stories.tsx  # Required
│   └── {component}.a11y.test.tsx # Required
├── project.json
└── index.ts
```

## CVA Common Mistakes

### Missing VariantProps for type inference

```tsx
// WRONG: variant/size props won't be typed
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';  // Manual duplication = drift
}

// CORRECT: Extract types from cva definition
interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}
```

### Not using cn() for class merging

```tsx
// WRONG: className prop conflicts with variant classes
className={buttonVariants({ variant, size })}

// CORRECT: Use cn() (tailwind-merge) to resolve conflicts
className={cn(buttonVariants({ variant, size }), className)}
```

### Overusing CVA for simple components

```tsx
// WRONG: CVA overhead for non-variant component
const cardVariants = cva('rounded-lg border p-4');
<div className={cardVariants()} />

// CORRECT: Just use classes directly
<div className="rounded-lg border p-4" />
```

### Forgetting defaultVariants

```tsx
// WRONG: Requires variant prop on every usage
const buttonVariants = cva('...', {
  variants: { variant: { primary: '...', secondary: '...' } },
});
<Button>Click</Button> // Error: variant required

// CORRECT: Provide sensible defaults
const buttonVariants = cva('...', {
  variants: { variant: { primary: '...', secondary: '...' } },
  defaultVariants: { variant: 'primary' },
});
<Button>Click</Button> // Works, uses primary
```

### Not forwarding refs

```tsx
// WRONG: Can't attach refs
function Button({ children, ...props }) {
  return <button {...props}>{children}</button>;
}

// CORRECT: Use forwardRef
const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ children, ...props }, ref) => {
    return <button ref={ref} {...props}>{children}</button>;
  }
);
```

## Story Example

```tsx
// {component}.stories.tsx
import type { Story } from '@ladle/react';
import { {Component} } from './{component}';

export default { title: 'UI/{Component}' };

export const Default: Story = () => <{Component}>Default</{Component}>;

export const Variants: Story = () => (
  <div className="flex flex-col gap-4">
    <{Component} variant="default">Default</{Component}>
    <{Component} variant="secondary">Secondary</{Component}>
    <{Component} variant="outline">Outline</{Component}>
  </div>
);

export const Sizes: Story = () => (
  <div className="flex items-center gap-4">
    <{Component} size="sm">Small</{Component}>
    <{Component} size="md">Medium</{Component}>
    <{Component} size="lg">Large</{Component}>
  </div>
);
```

## Accessibility Test

```tsx
// {component}.a11y.test.tsx
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { {Component} } from './{component}';

expect.extend(toHaveNoViolations);

describe('{Component} accessibility', () => {
  it('has no violations', async () => {
    const { container } = render(<{Component}>Click me</{Component}>);
    expect(await axe(container)).toHaveNoViolations();
  });
});
```

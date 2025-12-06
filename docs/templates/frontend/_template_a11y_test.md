# Accessibility Test Template

## Usage

Every UI component in libs/shared-ui must have an accessibility test.

## File Naming

```
{ComponentName}.a11y.test.tsx
```

## Template

```tsx
// {ComponentName}.a11y.test.tsx
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { describe, it, expect } from 'vitest';
import { ComponentName } from './ComponentName';

expect.extend(toHaveNoViolations);

describe('ComponentName Accessibility', () => {
  it('has no accessibility violations (default)', async () => {
    const { container } = render(<ComponentName>Content</ComponentName>);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('has no violations with all variants', async () => {
    const { container } = render(
      <div>
        <ComponentName variant="primary">Primary</ComponentName>
        <ComponentName variant="secondary">Secondary</ComponentName>
        <ComponentName disabled>Disabled</ComponentName>
      </div>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('is keyboard accessible', () => {
    render(<ComponentName>Content</ComponentName>);
    const element = screen.getByRole('button'); // adjust role as needed
    element.focus();
    expect(document.activeElement).toBe(element);
  });
});
```

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

## Running Tests

```bash
# Run all a11y tests
pnpm nx test ui-components --testNamePattern="Accessibility"

# Run specific component a11y test
pnpm nx test ui-components --testPathPattern="Button.a11y"
```

## Enforcement

The `pnpm lint:a11y` command checks that all UI components have a corresponding `.a11y.test.tsx` file.

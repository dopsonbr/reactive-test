# Ladle Story Template

## Usage

For documenting and visually testing UI components with Ladle.

## Structure

```tsx
// {component}.stories.tsx
import type { Story } from '@ladle/react';
import { {Component} } from './{component}';

export default {
  title: '{Category}/{Component}',
};

// Default story - most common usage
export const Default: Story = () => (
  <{Component}>Default content</{Component}>
);

// Show all variants
export const Variants: Story = () => (
  <div className="flex flex-col gap-4">
    <{Component} variant="primary">Primary</{Component}>
    <{Component} variant="secondary">Secondary</{Component}>
    <{Component} variant="outline">Outline</{Component}>
    <{Component} variant="ghost">Ghost</{Component}>
  </div>
);

// Show all sizes
export const Sizes: Story = () => (
  <div className="flex items-center gap-4">
    <{Component} size="sm">Small</{Component}>
    <{Component} size="md">Medium</{Component}>
    <{Component} size="lg">Large</{Component}>
  </div>
);

// Show interactive states
export const States: Story = () => (
  <div className="flex flex-col gap-4">
    <{Component}>Default</{Component}>
    <{Component} disabled>Disabled</{Component}>
    <{Component} isLoading>Loading</{Component}>
  </div>
);
```

## Interactive Story with Args

```tsx
// For stories that need user interaction
import type { Story, StoryDefault } from '@ladle/react';
import { {Component}, type {Component}Props } from './{component}';

export default {
  title: 'UI/{Component}',
} satisfies StoryDefault;

export const Interactive: Story<{Component}Props> = ({
  variant,
  size,
  children,
  disabled,
}) => (
  <{Component} variant={variant} size={size} disabled={disabled}>
    {children}
  </{Component}>
);

Interactive.args = {
  variant: 'primary',
  size: 'md',
  children: 'Interactive Button',
  disabled: false,
};

Interactive.argTypes = {
  variant: {
    options: ['primary', 'secondary', 'outline', 'ghost'],
    control: { type: 'select' },
  },
  size: {
    options: ['sm', 'md', 'lg'],
    control: { type: 'radio' },
  },
  disabled: {
    control: { type: 'boolean' },
  },
};
```

## Compound Component Story

```tsx
// Modal.stories.tsx
import type { Story } from '@ladle/react';
import { Modal } from './Modal';

export default { title: 'UI/Modal' };

export const Default: Story = () => (
  <Modal>
    <Modal.Trigger>Open Modal</Modal.Trigger>
    <Modal.Content>
      <Modal.Header>Modal Title</Modal.Header>
      <Modal.Body>
        <p>Modal content goes here.</p>
      </Modal.Body>
      <Modal.Footer>
        <Modal.Close>Cancel</Modal.Close>
        <button>Confirm</button>
      </Modal.Footer>
    </Modal.Content>
  </Modal>
);

export const WithForm: Story = () => (
  <Modal>
    <Modal.Trigger>Edit Profile</Modal.Trigger>
    <Modal.Content>
      <Modal.Header>Edit Profile</Modal.Header>
      <Modal.Body>
        <form className="space-y-4">
          <input placeholder="Name" className="w-full p-2 border rounded" />
          <input placeholder="Email" className="w-full p-2 border rounded" />
        </form>
      </Modal.Body>
      <Modal.Footer>
        <Modal.Close>Cancel</Modal.Close>
        <button>Save Changes</button>
      </Modal.Footer>
    </Modal.Content>
  </Modal>
);
```

## Story with Mock Data

```tsx
// ProductCard.stories.tsx
import type { Story } from '@ladle/react';
import { ProductCard } from './ProductCard';

export default { title: 'Features/ProductCard' };

const mockProduct = {
  id: '1',
  name: 'Example Product',
  price: 29.99,
  imageUrl: 'https://via.placeholder.com/200',
  description: 'A great product for demonstration.',
};

export const Default: Story = () => (
  <ProductCard product={mockProduct} />
);

export const OnSale: Story = () => (
  <ProductCard
    product={{ ...mockProduct, salePrice: 19.99 }}
  />
);

export const OutOfStock: Story = () => (
  <ProductCard
    product={{ ...mockProduct, inStock: false }}
  />
);

export const Grid: Story = () => (
  <div className="grid grid-cols-3 gap-4">
    <ProductCard product={mockProduct} />
    <ProductCard product={{ ...mockProduct, id: '2', name: 'Product 2' }} />
    <ProductCard product={{ ...mockProduct, id: '3', name: 'Product 3' }} />
  </div>
);
```

## Dark Mode Story

```tsx
// {component}.stories.tsx
export const DarkMode: Story = () => (
  <div className="dark bg-slate-900 p-8">
    <{Component}>Dark Mode</{Component}>
  </div>
);
```

## Rules

1. **One story file per component** - colocate with component
2. **Cover all variants, sizes, states** - document the full API
3. **Use descriptive story names** - `WithIcon`, `Loading`, `Error`
4. **Show real-world usage** - include realistic mock data
5. **Test edge cases** - long text, empty states, error states
6. **Include dark mode** if applicable

## File Location

```
libs/shared-ui/{component}/src/
├── {component}.tsx
├── {component}.stories.tsx  # Stories file
└── {component}.a11y.test.tsx
```

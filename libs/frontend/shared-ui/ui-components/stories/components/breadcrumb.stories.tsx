import type { Story } from '@ladle/react';
import { Breadcrumb } from '../../src/components/ui/breadcrumb';

export default {
  title: 'Components/Breadcrumb',
};

export const Default: Story = () => <Breadcrumb>Default Breadcrumb</Breadcrumb>;

export const Variants: Story = () => (
  <div className="flex flex-wrap gap-4">
    <Breadcrumb variant="default">Default</Breadcrumb>
    <Breadcrumb variant="secondary">Secondary</Breadcrumb>
  </div>
);
Variants.meta = { name: 'All Variants' };

export const Sizes: Story = () => (
  <div className="flex items-center gap-4">
    <Breadcrumb size="sm">Small</Breadcrumb>
    <Breadcrumb size="md">Medium</Breadcrumb>
    <Breadcrumb size="lg">Large</Breadcrumb>
  </div>
);

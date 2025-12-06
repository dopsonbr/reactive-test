import type { Story } from "@ladle/react";
import { Button } from "../../src/components/ui/button";

export default {
  title: "Components/Button",
};

export const Default: Story = () => <Button>Click me</Button>;

export const Variants: Story = () => (
  <div className="flex flex-wrap gap-4">
    <Button variant="default">Default</Button>
    <Button variant="secondary">Secondary</Button>
    <Button variant="destructive">Destructive</Button>
    <Button variant="outline">Outline</Button>
    <Button variant="ghost">Ghost</Button>
    <Button variant="link">Link</Button>
  </div>
);
Variants.meta = { name: "All Variants" };

export const Sizes: Story = () => (
  <div className="flex items-center gap-4">
    <Button size="sm">Small</Button>
    <Button size="default">Default</Button>
    <Button size="lg">Large</Button>
    <Button size="icon">🔔</Button>
  </div>
);

export const Disabled: Story = () => (
  <div className="flex gap-4">
    <Button disabled>Disabled Default</Button>
    <Button variant="secondary" disabled>Disabled Secondary</Button>
    <Button variant="destructive" disabled>Disabled Destructive</Button>
  </div>
);

export const WithIcon: Story = () => (
  <div className="flex gap-4">
    <Button>
      <span className="mr-2">📧</span>
      Login with Email
    </Button>
    <Button variant="outline">
      <span className="mr-2">🔗</span>
      Share
    </Button>
  </div>
);

export const Loading: Story = () => (
  <Button disabled>
    <span className="animate-spin mr-2">⏳</span>
    Loading...
  </Button>
);

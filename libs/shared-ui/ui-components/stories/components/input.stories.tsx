import type { Story } from "@ladle/react";
import { Input } from "../../src/components/ui/input";
import { Label } from "../../src/components/ui/label";

export default {
  title: "Components/Input",
};

export const Default: Story = () => <Input placeholder="Enter text..." />;

export const WithLabel: Story = () => (
  <div className="grid w-full max-w-sm gap-1.5">
    <Label htmlFor="email">Email</Label>
    <Input type="email" id="email" placeholder="Email address" />
  </div>
);

export const Disabled: Story = () => (
  <Input disabled placeholder="Disabled input" />
);

export const WithError: Story = () => (
  <div className="grid w-full max-w-sm gap-1.5">
    <Label htmlFor="email-error">Email</Label>
    <Input
      type="email"
      id="email-error"
      placeholder="Email address"
      aria-invalid="true"
      className="border-destructive focus-visible:ring-destructive"
    />
    <p className="text-sm text-destructive">Please enter a valid email address.</p>
  </div>
);

export const Types: Story = () => (
  <div className="grid gap-4 max-w-sm">
    <div className="grid gap-1.5">
      <Label htmlFor="text">Text</Label>
      <Input type="text" id="text" placeholder="Text input" />
    </div>
    <div className="grid gap-1.5">
      <Label htmlFor="password">Password</Label>
      <Input type="password" id="password" placeholder="Password" />
    </div>
    <div className="grid gap-1.5">
      <Label htmlFor="number">Number</Label>
      <Input type="number" id="number" placeholder="0" />
    </div>
    <div className="grid gap-1.5">
      <Label htmlFor="search">Search</Label>
      <Input type="search" id="search" placeholder="Search..." />
    </div>
  </div>
);

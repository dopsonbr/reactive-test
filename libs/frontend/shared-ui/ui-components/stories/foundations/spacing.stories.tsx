import type { Story } from "@ladle/react";

export default {
  title: "Foundations/Spacing",
};

const SpacingSwatch = ({ name, cssVar }: { name: string; cssVar: string }) => (
  <div className="flex items-center gap-4 py-1">
    <div
      className="h-4 bg-primary"
      style={{ width: `var(${cssVar})` }}
    />
    <div className="text-sm">
      <span className="font-medium">{name}</span>
      <code className="ml-2 text-xs text-muted-foreground">{cssVar}</code>
    </div>
  </div>
);

export const SpacingScale: Story = () => (
  <div className="space-y-2">
    <h3 className="font-semibold mb-4">Spacing Scale</h3>
    <SpacingSwatch name="1 (4px)" cssVar="--spacing-1" />
    <SpacingSwatch name="2 (8px)" cssVar="--spacing-2" />
    <SpacingSwatch name="3 (12px)" cssVar="--spacing-3" />
    <SpacingSwatch name="4 (16px)" cssVar="--spacing-4" />
    <SpacingSwatch name="5 (20px)" cssVar="--spacing-5" />
    <SpacingSwatch name="6 (24px)" cssVar="--spacing-6" />
    <SpacingSwatch name="8 (32px)" cssVar="--spacing-8" />
    <SpacingSwatch name="10 (40px)" cssVar="--spacing-10" />
    <SpacingSwatch name="12 (48px)" cssVar="--spacing-12" />
    <SpacingSwatch name="16 (64px)" cssVar="--spacing-16" />
    <SpacingSwatch name="20 (80px)" cssVar="--spacing-20" />
    <SpacingSwatch name="24 (96px)" cssVar="--spacing-24" />
  </div>
);

const RadiusSwatch = ({ name, cssVar }: { name: string; cssVar: string }) => (
  <div className="flex items-center gap-4 py-1">
    <div
      className="w-16 h-16 bg-primary"
      style={{ borderRadius: `var(${cssVar})` }}
    />
    <div className="text-sm">
      <span className="font-medium">{name}</span>
      <code className="ml-2 text-xs text-muted-foreground">{cssVar}</code>
    </div>
  </div>
);

export const BorderRadius: Story = () => (
  <div className="space-y-4">
    <h3 className="font-semibold mb-4">Border Radius</h3>
    <RadiusSwatch name="SM (2px)" cssVar="--radius-sm" />
    <RadiusSwatch name="MD (6px)" cssVar="--radius-md" />
    <RadiusSwatch name="LG (8px)" cssVar="--radius-lg" />
    <RadiusSwatch name="XL (12px)" cssVar="--radius-xl" />
    <RadiusSwatch name="2XL (16px)" cssVar="--radius-2xl" />
    <RadiusSwatch name="Full" cssVar="--radius-full" />
  </div>
);

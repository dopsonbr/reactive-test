import type { Story } from "@ladle/react";

export default {
  title: "Foundations/Colors",
};

const ColorSwatch = ({ name, cssVar }: { name: string; cssVar: string }) => (
  <div className="flex items-center gap-4 p-2">
    <div
      className="w-12 h-12 rounded border"
      style={{ backgroundColor: `var(${cssVar})` }}
    />
    <div>
      <div className="font-medium">{name}</div>
      <code className="text-xs text-muted-foreground">{cssVar}</code>
    </div>
  </div>
);

export const SemanticColors: Story = () => (
  <div className="grid gap-2">
    <h3 className="font-semibold mb-2">Semantic Colors</h3>
    <ColorSwatch name="Background" cssVar="--color-background" />
    <ColorSwatch name="Foreground" cssVar="--color-foreground" />
    <ColorSwatch name="Primary" cssVar="--color-primary" />
    <ColorSwatch name="Primary Foreground" cssVar="--color-primary-foreground" />
    <ColorSwatch name="Secondary" cssVar="--color-secondary" />
    <ColorSwatch name="Muted" cssVar="--color-muted" />
    <ColorSwatch name="Accent" cssVar="--color-accent" />
    <ColorSwatch name="Destructive" cssVar="--color-destructive" />
    <ColorSwatch name="Border" cssVar="--color-border" />
  </div>
);

export const GrayScale: Story = () => (
  <div className="grid gap-2">
    <h3 className="font-semibold mb-2">Gray Scale</h3>
    <ColorSwatch name="Gray 50" cssVar="--color-gray-50" />
    <ColorSwatch name="Gray 100" cssVar="--color-gray-100" />
    <ColorSwatch name="Gray 200" cssVar="--color-gray-200" />
    <ColorSwatch name="Gray 300" cssVar="--color-gray-300" />
    <ColorSwatch name="Gray 400" cssVar="--color-gray-400" />
    <ColorSwatch name="Gray 500" cssVar="--color-gray-500" />
    <ColorSwatch name="Gray 600" cssVar="--color-gray-600" />
    <ColorSwatch name="Gray 700" cssVar="--color-gray-700" />
    <ColorSwatch name="Gray 800" cssVar="--color-gray-800" />
    <ColorSwatch name="Gray 900" cssVar="--color-gray-900" />
    <ColorSwatch name="Gray 950" cssVar="--color-gray-950" />
  </div>
);

export const DarkMode: Story = () => (
  <div className="dark bg-background text-foreground p-4 rounded">
    <h3 className="font-semibold mb-4">Dark Mode</h3>
    <ColorSwatch name="Background (Dark)" cssVar="--color-background" />
    <ColorSwatch name="Foreground (Dark)" cssVar="--color-foreground" />
    <ColorSwatch name="Primary (Dark)" cssVar="--color-primary" />
    <ColorSwatch name="Muted (Dark)" cssVar="--color-muted" />
  </div>
);

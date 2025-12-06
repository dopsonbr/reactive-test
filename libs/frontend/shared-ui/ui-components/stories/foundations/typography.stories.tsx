import type { Story } from "@ladle/react";

export default {
  title: "Foundations/Typography",
};

export const FontSizes: Story = () => (
  <div className="space-y-4">
    <h3 className="font-semibold mb-4">Font Sizes</h3>
    <p style={{ fontSize: "var(--text-xs)" }}>Text XS (12px) - The quick brown fox</p>
    <p style={{ fontSize: "var(--text-sm)" }}>Text SM (14px) - The quick brown fox</p>
    <p style={{ fontSize: "var(--text-base)" }}>Text Base (16px) - The quick brown fox</p>
    <p style={{ fontSize: "var(--text-lg)" }}>Text LG (18px) - The quick brown fox</p>
    <p style={{ fontSize: "var(--text-xl)" }}>Text XL (20px) - The quick brown fox</p>
    <p style={{ fontSize: "var(--text-2xl)" }}>Text 2XL (24px) - The quick brown fox</p>
    <p style={{ fontSize: "var(--text-3xl)" }}>Text 3XL (30px) - The quick brown fox</p>
    <p style={{ fontSize: "var(--text-4xl)" }}>Text 4XL (36px) - The quick brown fox</p>
  </div>
);

export const FontWeights: Story = () => (
  <div className="space-y-4">
    <h3 className="font-semibold mb-4">Font Weights</h3>
    <p style={{ fontWeight: "var(--font-normal)" }}>Normal (400) - The quick brown fox</p>
    <p style={{ fontWeight: "var(--font-medium)" }}>Medium (500) - The quick brown fox</p>
    <p style={{ fontWeight: "var(--font-semibold)" }}>Semibold (600) - The quick brown fox</p>
    <p style={{ fontWeight: "var(--font-bold)" }}>Bold (700) - The quick brown fox</p>
  </div>
);

export const FontFamilies: Story = () => (
  <div className="space-y-4">
    <h3 className="font-semibold mb-4">Font Families</h3>
    <p style={{ fontFamily: "var(--font-sans)" }}>Sans-serif - The quick brown fox jumps over the lazy dog</p>
    <p style={{ fontFamily: "var(--font-mono)" }}>Monospace - The quick brown fox jumps over the lazy dog</p>
  </div>
);

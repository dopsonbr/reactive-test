# 022B_COMPONENT_LIBRARY

**Status: DRAFT**

---

## Overview

Build the shared UI component library with shadcn/ui primitives, organize Ladle stories by domain, configure testing with Vitest + RTL + axe-core, and create custom Nx workspace generators for component scaffolding.

**Related Plans:**
- [022_DESIGN_SYSTEM_AND_COMPONENT_LIBRARY](./022_DESIGN_SYSTEM_AND_COMPONENT_LIBRARY.md) - Parent plan
- [022A_DESIGN_TOKENS_THEME](./022A_DESIGN_TOKENS_THEME.md) - Token foundation (prerequisite)

---

## Goals

1. Scaffold `libs/shared-ui/ui-components` library with Nx
2. Initialize shadcn/ui with monorepo configuration
3. Add core primitives: Button, Input, Card, Dialog, Form controls
4. Organize Ladle stories: Foundations, Components, Patterns
5. Configure Vitest + RTL + axe-core for all components
6. Create custom Nx generators for component scaffolding
7. Optional: Add Playwright visual regression tests

---

## References

**ADRs:**
- `docs/ADRs/008_component_library_design_system.md` - shadcn/ui decision
- `docs/ADRs/009_frontend_testing_strategy.md` - Testing Trophy model

**Standards (after 021B):**
- `docs/standards/frontend/components.md` - Component patterns
- `docs/standards/frontend/testing.md` - Testing patterns

---

## Phase 1: Scaffold UI Components Library

**Prereqs:** 020 Phase 1.1 complete, 022A Phase 1 complete (tokens exist)
**Blockers:** None

### 1.1 Generate React Library with Vite

**Commands:**
```bash
nx g @nx/react:lib ui-components \
  --directory=libs/shared-ui \
  --bundler=vite \
  --style=css \
  --unitTestRunner=vitest \
  --tags="scope:shared,type:lib,platform:web"
```

**Files created by generator:**
- `libs/shared-ui/ui-components/project.json`
- `libs/shared-ui/ui-components/package.json`
- `libs/shared-ui/ui-components/vite.config.ts`
- `libs/shared-ui/ui-components/tsconfig.json`
- `libs/shared-ui/ui-components/src/index.ts`

### 1.2 Add Tailwind Support

**Commands:**
```bash
nx g @nx/react:setup-tailwind --project=ui-components
```

### 1.3 Initialize shadcn/ui

**Commands:**
```bash
cd libs/shared-ui/ui-components
pnpm dlx shadcn@latest init
```

**Prompts (select):**
- Style: Default
- Base color: Slate
- CSS variables: Yes
- Tailwind config: `tailwind.config.ts`
- Components path: `src/components/ui`
- Utils path: `src/lib/utils`

**Files:**
- CREATE: `libs/shared-ui/ui-components/components.json`

**Implementation (components.json):**

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "default",
  "rsc": false,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.ts",
    "css": "src/styles/globals.css",
    "baseColor": "slate",
    "cssVariables": true
  },
  "aliases": {
    "components": "@reactive-platform/shared-ui-components/components",
    "utils": "@reactive-platform/shared-ui-components/lib",
    "ui": "@reactive-platform/shared-ui-components/components/ui",
    "lib": "@reactive-platform/shared-ui-components/lib"
  }
}
```

---

## Phase 2: Add Core Primitives

**Prereqs:** Phase 1 complete
**Blockers:** None

### 2.1 Add shadcn/ui Components

**Commands:**
```bash
cd libs/shared-ui/ui-components

# Core primitives
pnpm dlx shadcn@latest add button
pnpm dlx shadcn@latest add input
pnpm dlx shadcn@latest add label
pnpm dlx shadcn@latest add card
pnpm dlx shadcn@latest add dialog
pnpm dlx shadcn@latest add select
pnpm dlx shadcn@latest add checkbox
pnpm dlx shadcn@latest add textarea
pnpm dlx shadcn@latest add form
```

**Files created by shadcn:**
- `src/components/ui/button.tsx`
- `src/components/ui/input.tsx`
- `src/components/ui/label.tsx`
- `src/components/ui/card.tsx`
- `src/components/ui/dialog.tsx`
- `src/components/ui/select.tsx`
- `src/components/ui/checkbox.tsx`
- `src/components/ui/textarea.tsx`
- `src/components/ui/form.tsx`

### 2.2 Export Components from Index

**Files:**
- MODIFY: `libs/shared-ui/ui-components/src/index.ts`

**Implementation:**

```typescript
// Components
export * from "./components/ui/button";
export * from "./components/ui/input";
export * from "./components/ui/label";
export * from "./components/ui/card";
export * from "./components/ui/dialog";
export * from "./components/ui/select";
export * from "./components/ui/checkbox";
export * from "./components/ui/textarea";
export * from "./components/ui/form";

// Utilities
export { cn } from "./lib/utils";
```

---

## Phase 3: Configure Ladle Stories

**Prereqs:** Phase 2 complete
**Blockers:** None

### 3.1 Install Ladle

**Commands:**
```bash
pnpm add -D @ladle/react
```

### 3.2 Configure Ladle

**Files:**
- CREATE: `libs/shared-ui/ui-components/.ladle/config.mjs`
- CREATE: `libs/shared-ui/ui-components/.ladle/components.tsx`

**Implementation (config.mjs):**

```javascript
/** @type {import('@ladle/react').UserConfig} */
export default {
  stories: "../stories/**/*.stories.tsx",
  outDir: "dist-ladle",
  viteConfig: "../vite.config.ts",
  addons: {
    a11y: { enabled: true },
    action: { enabled: true },
    control: { enabled: true },
    ladle: { enabled: true },
    mode: { enabled: true },
    rtl: { enabled: true },
    source: { enabled: true },
    theme: { enabled: true },
    width: { enabled: true },
  },
  defaultStory: "foundations--colors",
};
```

**Implementation (components.tsx):**

```tsx
import type { GlobalProvider } from "@ladle/react";
import "../src/styles/globals.css";

export const Provider: GlobalProvider = ({ children }) => (
  <div className="p-4">{children}</div>
);
```

### 3.3 Add Ladle Scripts to project.json

**Files:**
- MODIFY: `libs/shared-ui/ui-components/project.json`

**Implementation (add to targets):**

```json
{
  "targets": {
    "ladle": {
      "executor": "nx:run-commands",
      "options": {
        "command": "pnpm ladle serve",
        "cwd": "libs/shared-ui/ui-components"
      }
    },
    "ladle-build": {
      "executor": "nx:run-commands",
      "options": {
        "command": "pnpm ladle build",
        "cwd": "libs/shared-ui/ui-components"
      }
    }
  }
}
```

### 3.4 Create Story Structure

**Files:**
- CREATE: `libs/shared-ui/ui-components/stories/foundations/colors.stories.tsx`
- CREATE: `libs/shared-ui/ui-components/stories/foundations/typography.stories.tsx`
- CREATE: `libs/shared-ui/ui-components/stories/foundations/spacing.stories.tsx`
- CREATE: `libs/shared-ui/ui-components/stories/components/button.stories.tsx`
- CREATE: `libs/shared-ui/ui-components/stories/components/input.stories.tsx`
- CREATE: `libs/shared-ui/ui-components/stories/components/card.stories.tsx`
- CREATE: `libs/shared-ui/ui-components/stories/components/dialog.stories.tsx`
- CREATE: `libs/shared-ui/ui-components/stories/patterns/form.stories.tsx`

**Implementation (button.stories.tsx):**

```tsx
import type { Story } from "@ladle/react";
import { Button } from "../../src/components/ui/button";

export default {
  title: "Components/Button",
};

export const Default: Story = () => <Button>Click me</Button>;

export const Variants: Story = () => (
  <div className="flex gap-4">
    <Button variant="default">Default</Button>
    <Button variant="secondary">Secondary</Button>
    <Button variant="destructive">Destructive</Button>
    <Button variant="outline">Outline</Button>
    <Button variant="ghost">Ghost</Button>
  </div>
);
Variants.meta = { name: "All Variants" };

export const Sizes: Story = () => (
  <div className="flex items-center gap-4">
    <Button size="sm">Small</Button>
    <Button size="default">Default</Button>
    <Button size="lg">Large</Button>
  </div>
);

export const Disabled: Story = () => <Button disabled>Disabled</Button>;

export const Loading: Story = () => (
  <Button disabled>
    <span className="animate-spin mr-2">...</span>
    Loading
  </Button>
);

// Required states for design review
export const Hover: Story = () => (
  <Button className="hover:bg-primary/90">Hover State</Button>
);

export const Focus: Story = () => (
  <Button className="ring-2 ring-ring ring-offset-2">Focus State</Button>
);

export const Error: Story = () => (
  <Button variant="destructive">Error Action</Button>
);

export const RTL: Story = () => (
  <div dir="rtl">
    <Button>Right to Left</Button>
  </div>
);
RTL.meta = { name: "RTL Support" };
```

**Implementation (colors.stories.tsx):**

```tsx
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
    <ColorSwatch name="Secondary" cssVar="--color-secondary" />
    <ColorSwatch name="Muted" cssVar="--color-muted" />
    <ColorSwatch name="Accent" cssVar="--color-accent" />
    <ColorSwatch name="Destructive" cssVar="--color-destructive" />
    <ColorSwatch name="Border" cssVar="--color-border" />
  </div>
);

export const DarkMode: Story = () => (
  <div className="dark bg-background p-4 rounded">
    <ColorSwatch name="Background (Dark)" cssVar="--color-background" />
    <ColorSwatch name="Foreground (Dark)" cssVar="--color-foreground" />
  </div>
);
```

---

## Phase 4: Configure Testing

**Prereqs:** Phase 2 complete
**Blockers:** None

### 4.1 Install Test Dependencies

**Commands:**
```bash
pnpm add -D @testing-library/react @testing-library/jest-dom vitest-axe @axe-core/react
```

### 4.2 Configure Vitest

**Files:**
- MODIFY: `libs/shared-ui/ui-components/vite.config.ts`

**Implementation (add test config):**

```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: ["**/*.stories.tsx", "**/*.test.tsx"],
    },
  },
});
```

### 4.3 Create Test Setup

**Files:**
- CREATE: `libs/shared-ui/ui-components/src/test/setup.ts`

**Implementation:**

```typescript
import "@testing-library/jest-dom/vitest";
import { configureAxe } from "vitest-axe";

// Configure axe for accessibility testing
configureAxe({
  rules: {
    // Disable rules that don't apply in test environment
    region: { enabled: false },
  },
});
```

### 4.4 Create Component Tests

**Files:**
- CREATE: `libs/shared-ui/ui-components/src/components/ui/button.test.tsx`
- CREATE: `libs/shared-ui/ui-components/src/components/ui/input.test.tsx`

**Implementation (button.test.tsx):**

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";
import { Button } from "./button";

describe("Button", () => {
  it("renders children", () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole("button", { name: /click me/i })).toBeInTheDocument();
  });

  it("handles click events", async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Click me</Button>);

    await userEvent.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("respects disabled state", async () => {
    const onClick = vi.fn();
    render(<Button disabled onClick={onClick}>Disabled</Button>);

    const button = screen.getByRole("button");
    expect(button).toBeDisabled();

    await userEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("applies variant classes", () => {
    const { rerender } = render(<Button variant="destructive">Delete</Button>);
    expect(screen.getByRole("button")).toHaveClass("bg-destructive");

    rerender(<Button variant="outline">Outline</Button>);
    expect(screen.getByRole("button")).toHaveClass("border");
  });

  it("has no accessibility violations", async () => {
    const { container } = render(<Button>Accessible</Button>);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("has no accessibility violations when disabled", async () => {
    const { container } = render(<Button disabled>Disabled</Button>);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
```

**Implementation (input.test.tsx):**

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";
import { Input } from "./input";
import { Label } from "./label";

describe("Input", () => {
  it("renders with placeholder", () => {
    render(<Input placeholder="Enter text" />);
    expect(screen.getByPlaceholderText("Enter text")).toBeInTheDocument();
  });

  it("accepts user input", async () => {
    render(<Input />);
    const input = screen.getByRole("textbox");

    await userEvent.type(input, "Hello");
    expect(input).toHaveValue("Hello");
  });

  it("respects disabled state", () => {
    render(<Input disabled />);
    expect(screen.getByRole("textbox")).toBeDisabled();
  });

  it("has no accessibility violations with label", async () => {
    const { container } = render(
      <>
        <Label htmlFor="test-input">Test Label</Label>
        <Input id="test-input" />
      </>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("shows error state accessibly", async () => {
    const { container } = render(
      <Input aria-invalid="true" aria-describedby="error" />
    );
    expect(screen.getByRole("textbox")).toHaveAttribute("aria-invalid", "true");
  });
});
```

---

## Phase 5: Create Custom Nx Generators

**Prereqs:** Phase 4 complete
**Blockers:** None

### 5.1 Scaffold Workspace Plugin

**Commands:**
```bash
nx add @nx/plugin
nx g @nx/plugin:plugin workspace-plugin --directory=tools --minimal
```

### 5.2 Generate ui-component Generator

**Commands:**
```bash
nx g @nx/plugin:generator ui-component --project=workspace-plugin
```

### 5.3 Implement ui-component Generator

**Files:**
- MODIFY: `tools/workspace-plugin/src/generators/ui-component/generator.ts`
- MODIFY: `tools/workspace-plugin/src/generators/ui-component/schema.json`
- CREATE: `tools/workspace-plugin/src/generators/ui-component/files/component.tsx.template`
- CREATE: `tools/workspace-plugin/src/generators/ui-component/files/component.test.tsx.template`
- CREATE: `tools/workspace-plugin/src/generators/ui-component/files/component.stories.tsx.template`

**Implementation (schema.json):**

```json
{
  "$schema": "https://json-schema.org/schema",
  "$id": "UiComponent",
  "title": "UI Component Generator",
  "type": "object",
  "properties": {
    "name": {
      "type": "string",
      "description": "Component name (PascalCase)",
      "$default": { "$source": "argv", "index": 0 },
      "x-prompt": "What is the component name?"
    },
    "description": {
      "type": "string",
      "description": "Component description for stories"
    },
    "withStory": {
      "type": "boolean",
      "description": "Generate Ladle story",
      "default": true
    },
    "withTest": {
      "type": "boolean",
      "description": "Generate test file",
      "default": true
    },
    "category": {
      "type": "string",
      "description": "Story category",
      "enum": ["foundations", "components", "patterns"],
      "default": "components"
    }
  },
  "required": ["name"]
}
```

**Implementation (generator.ts):**

```typescript
import {
  Tree,
  formatFiles,
  generateFiles,
  names,
  joinPathFragments,
} from "@nx/devkit";
import * as path from "path";

interface UiComponentGeneratorSchema {
  name: string;
  description?: string;
  withStory: boolean;
  withTest: boolean;
  category: "foundations" | "components" | "patterns";
}

export async function uiComponentGenerator(
  tree: Tree,
  options: UiComponentGeneratorSchema
) {
  const componentNames = names(options.name);
  const componentDir = joinPathFragments(
    "libs/shared-ui/ui-components/src/components/ui"
  );
  const storyDir = joinPathFragments(
    "libs/shared-ui/ui-components/stories",
    options.category
  );

  // Generate component file
  generateFiles(tree, path.join(__dirname, "files"), componentDir, {
    ...componentNames,
    description: options.description || `${componentNames.className} component`,
    template: "",
  });

  // Generate story if requested
  if (options.withStory) {
    generateFiles(
      tree,
      path.join(__dirname, "story-files"),
      storyDir,
      {
        ...componentNames,
        category: options.category,
        template: "",
      }
    );
  }

  // Update index.ts exports
  const indexPath = "libs/shared-ui/ui-components/src/index.ts";
  const indexContent = tree.read(indexPath, "utf-8") || "";
  const exportLine = `export * from "./components/ui/${componentNames.fileName}";\n`;

  if (!indexContent.includes(exportLine)) {
    tree.write(indexPath, indexContent + exportLine);
  }

  await formatFiles(tree);

  return () => {
    console.log(`
Component ${componentNames.className} generated!

Files created:
  - src/components/ui/${componentNames.fileName}.tsx
  ${options.withTest ? `- src/components/ui/${componentNames.fileName}.test.tsx` : ""}
  ${options.withStory ? `- stories/${options.category}/${componentNames.fileName}.stories.tsx` : ""}

Next steps:
  1. Implement component logic
  2. Add CVA variants
  3. Run tests: nx test ui-components
  4. View in Ladle: nx ladle ui-components
    `);
  };
}

export default uiComponentGenerator;
```

**Implementation (component.tsx.template):**

```tsx
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const <%= fileName %>Variants = cva(
  // Base styles
  "inline-flex items-center justify-center",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground",
        secondary: "bg-secondary text-secondary-foreground",
      },
      size: {
        sm: "h-8 px-3 text-sm",
        md: "h-10 px-4 text-base",
        lg: "h-12 px-6 text-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
);

export interface <%= className %>Props
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof <%= fileName %>Variants> {}

const <%= className %> = React.forwardRef<<%= className %>Props>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(<%= fileName %>Variants({ variant, size }), className)}
        {...props}
      />
    );
  }
);
<%= className %>.displayName = "<%= className %>";

export { <%= className %>, <%= fileName %>Variants };
```

### 5.4 Usage

**Commands:**
```bash
# Generate new component with story and test
nx g @reactive-platform/workspace-plugin:ui-component Alert \
  --description="Alert/notification component" \
  --category=components

# Generate component without story
nx g @reactive-platform/workspace-plugin:ui-component Spinner --withStory=false
```

---

## Phase 6 (Optional): Visual Regression with Playwright

**Prereqs:** Phase 3 complete (Ladle running)
**Blockers:** Ladle must be built

### 6.1 Install Playwright

**Commands:**
```bash
pnpm add -D @playwright/test
npx playwright install chromium
```

### 6.2 Configure Playwright

**Files:**
- CREATE: `libs/shared-ui/ui-components/playwright.config.ts`
- CREATE: `libs/shared-ui/ui-components/e2e/visual.spec.ts`

**Implementation (playwright.config.ts):**

```typescript
import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  snapshotDir: "./e2e/snapshots",
  updateSnapshots: "missing",
  use: {
    baseURL: "http://localhost:61000", // Ladle default port
    screenshot: "only-on-failure",
  },
  webServer: {
    command: "pnpm ladle serve",
    port: 61000,
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    { name: "chromium", use: { browserName: "chromium" } },
  ],
});
```

**Implementation (visual.spec.ts):**

```typescript
import { test, expect } from "@playwright/test";

const components = [
  { path: "?story=components--button--default", name: "button-default" },
  { path: "?story=components--button--variants", name: "button-variants" },
  { path: "?story=components--input--default", name: "input-default" },
  { path: "?story=components--card--default", name: "card-default" },
];

for (const component of components) {
  test(`visual: ${component.name}`, async ({ page }) => {
    await page.goto(component.path);
    await expect(page.locator("[data-storyloaded]")).toBeVisible();
    await expect(page).toHaveScreenshot(`${component.name}.png`);
  });

  test(`visual: ${component.name} (dark)`, async ({ page }) => {
    await page.goto(`${component.path}&mode=dark`);
    await expect(page.locator("[data-storyloaded]")).toBeVisible();
    await expect(page).toHaveScreenshot(`${component.name}-dark.png`);
  });
}
```

---

## Files Summary

| Action | File | Purpose |
|--------|------|---------|
| CREATE | `libs/shared-ui/ui-components/project.json` | Nx config (via generator) |
| CREATE | `libs/shared-ui/ui-components/components.json` | shadcn/ui config |
| CREATE | `libs/shared-ui/ui-components/src/components/ui/*.tsx` | UI components |
| CREATE | `libs/shared-ui/ui-components/.ladle/config.mjs` | Ladle config |
| CREATE | `libs/shared-ui/ui-components/.ladle/components.tsx` | Ladle provider |
| CREATE | `libs/shared-ui/ui-components/stories/**/*.stories.tsx` | Component stories |
| CREATE | `libs/shared-ui/ui-components/src/test/setup.ts` | Test setup |
| CREATE | `libs/shared-ui/ui-components/src/components/ui/*.test.tsx` | Component tests |
| CREATE | `tools/workspace-plugin/src/generators/ui-component/*` | Custom generator |
| MODIFY | `libs/shared-ui/ui-components/src/index.ts` | Component exports |
| MODIFY | `libs/shared-ui/ui-components/project.json` | Add ladle targets |

---

## Documentation Updates

| File | Update Required |
|------|-----------------|
| `CLAUDE.md` | Add ui-components to module overview, add Ladle/test commands |
| `libs/shared-ui/ui-components/README.md` | Full library documentation |
| `libs/shared-ui/ui-components/AGENTS.md` | AI agent guidance |
| `tools/workspace-plugin/README.md` | Generator documentation |

---

## Checklist

- [ ] Phase 1: UI library scaffolded with Nx
- [ ] Phase 1: shadcn/ui initialized
- [ ] Phase 2: Core primitives added (Button, Input, Card, Dialog, Form)
- [ ] Phase 3: Ladle configured and stories created
- [ ] Phase 3: Stories organized by domain (Foundations, Components, Patterns)
- [ ] Phase 4: Vitest + RTL + axe-core configured
- [ ] Phase 4: All components have tests with a11y checks
- [ ] Phase 5: Custom Nx generator for ui-component
- [ ] Phase 6 (optional): Playwright visual regression
- [ ] Documentation complete

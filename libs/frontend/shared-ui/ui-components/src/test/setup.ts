import "@testing-library/jest-dom/vitest";
import * as matchers from "vitest-axe/matchers";
import { expect } from "vitest";

// Extend expect with axe matchers
expect.extend(matchers);

// Mock canvas for jsdom (needed for axe-core)
HTMLCanvasElement.prototype.getContext = () => null;

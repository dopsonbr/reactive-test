import type { GlobalProvider } from "@ladle/react";
import "../src/styles/globals.css";

export const Provider: GlobalProvider = ({ children }) => (
  <div className="p-4">{children}</div>
);

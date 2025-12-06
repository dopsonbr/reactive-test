import type { GlobalProvider } from '@ladle/react';
import '../src/styles.css';

export const Provider: GlobalProvider = ({ children }) => {
  return <div className="p-4">{children}</div>;
};

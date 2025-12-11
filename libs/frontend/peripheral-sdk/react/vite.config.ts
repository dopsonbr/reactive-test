/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import dts from 'vite-plugin-dts';
import { resolve } from 'path';

// Resolve workspace root (4 levels up from this file)
const workspaceRoot = resolve(__dirname, '../../../../');

export default defineConfig({
  resolve: {
    alias: {
      '@reactive-platform/peripheral-core': resolve(
        __dirname,
        '../core/src/index.ts'
      ),
    },
  },
  plugins: [
    react(),
    dts({
      entryRoot: 'src',
      tsconfigPath: resolve(__dirname, 'tsconfig.lib.json'),
    }),
  ],
  build: {
    outDir: resolve(workspaceRoot, 'dist/libs/frontend/peripheral-sdk/react'),
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      formats: ['es'],
      fileName: 'index',
    },
    rollupOptions: {
      external: ['react', 'react-dom', '@reactive-platform/peripheral-core'],
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['src/**/*.spec.{ts,tsx}'],
    setupFiles: ['./src/test-setup.ts'],
  },
});

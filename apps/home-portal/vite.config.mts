/// <reference types='vitest' />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import { nxCopyAssetsPlugin } from '@nx/vite/plugins/nx-copy-assets.plugin';
import { resolve } from 'path';

export default defineConfig(() => ({
  resolve: {
    alias: {
      '@reactive-platform/shared-design-tokens': resolve(
        import.meta.dirname,
        '../../libs/frontend/shared-design/tokens/src/index.css'
      ),
    },
  },
  root: import.meta.dirname,
  cacheDir: '../../node_modules/.vite/apps/home-portal',
  server: {
    port: 3003,
    host: 'localhost',
  },
  preview: {
    port: 3003,
    host: 'localhost',
  },
  plugins: [react(), nxViteTsPaths(), nxCopyAssetsPlugin(['*.md'])],
  build: {
    outDir: '../../dist/apps/home-portal',
    emptyOutDir: true,
    reportCompressedSize: true,
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
  test: {
    name: 'home-portal',
    watch: false,
    globals: true,
    environment: 'jsdom',
    include: ['{src,tests}/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    setupFiles: ['./src/test/setup.ts'],
    reporters: ['default'],
    coverage: {
      reportsDirectory: '../../coverage/apps/home-portal',
      provider: 'v8' as const,
    },
  },
}));

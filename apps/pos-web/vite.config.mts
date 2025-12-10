/// <reference types='vitest' />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import { nxCopyAssetsPlugin } from '@nx/vite/plugins/nx-copy-assets.plugin';

export default defineConfig(() => ({
  root: import.meta.dirname,
  cacheDir: '../../node_modules/.vite/apps/pos-web',
  server: {
    port: 3004,
    host: 'localhost',
    proxy: {
      '/products': 'http://localhost:8090',
      '/carts': 'http://localhost:8081',
      '/customers': 'http://localhost:8083',
      '/discount': 'http://localhost:8084',
      '/markdowns': 'http://localhost:8084',
      '/fulfillments': 'http://localhost:8085',
      '/checkout': 'http://localhost:8087',
      '/orders': 'http://localhost:8088',
      '/fake-auth': 'http://localhost:8082',
    },
  },
  preview: {
    port: 3004,
    host: 'localhost',
  },
  plugins: [react(), nxViteTsPaths(), nxCopyAssetsPlugin(['*.md'])],
  build: {
    outDir: '../../dist/apps/pos-web',
    emptyOutDir: true,
    reportCompressedSize: true,
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
  test: {
    name: 'pos-web',
    watch: false,
    globals: true,
    environment: 'jsdom',
    include: ['{src,tests}/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    reporters: ['default'],
    coverage: {
      reportsDirectory: '../../coverage/apps/pos-web',
      provider: 'v8' as const,
    },
  },
}));

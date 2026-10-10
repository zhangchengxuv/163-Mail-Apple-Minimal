import { resolve } from 'node:path';
import { defineConfig } from 'vite';

/** MV3 background service worker bundled as one classic script. */
export default defineConfig({
  base: './',
  build: {
    outDir: 'dist',
    emptyOutDir: false,
    rollupOptions: {
      input: { background: resolve(__dirname, 'src/background/index.ts') },
      output: {
        format: 'iife',
        inlineDynamicImports: true,
        entryFileNames: 'assets/[name].js'
      }
    }
  }
});

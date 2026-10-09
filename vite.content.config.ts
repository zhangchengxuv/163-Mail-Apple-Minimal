import { resolve } from 'node:path';
import { defineConfig } from 'vite';

/** Chrome content_scripts are classic scripts, not ES modules. */
export default defineConfig({
  base: './',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: { content: resolve(__dirname, 'src/content/index.ts') },
      output: {
        format: 'iife',
        inlineDynamicImports: true,
        entryFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name][extname]'
      }
    }
  }
});

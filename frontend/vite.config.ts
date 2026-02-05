import { defineConfig } from 'vite';
import { resolve } from 'path';

const root = __dirname;

export default defineConfig({
  root,
  publicDir: false,
  resolve: {
    alias: {
      '@': resolve(root, 'src'),
    },
  },
  build: {
    outDir: resolve(root, '../public'),
    emptyOutDir: false,
    rollupOptions: {
      input: {
        home: resolve(root, 'index.html'),
        docs: resolve(root, 'docs.html'),
        demo: resolve(root, 'apps/demo/index.html'),
      },
      output: {
        assetFileNames: 'assets/[name]-[hash][extname]',
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
      },
    },
  },
});

import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  base: './',
  publicDir: 'public',
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: 'index.html',
    },
  },
});

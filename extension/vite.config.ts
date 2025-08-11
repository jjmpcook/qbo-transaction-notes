import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: resolve(__dirname, 'src/content.ts'),
      output: {
        entryFileNames: 'content.js',
        format: 'iife'
      }
    }
  },
  define: {
    'process.env.BACKEND_URL': JSON.stringify('https://httpbin.org/post'),
  },
});
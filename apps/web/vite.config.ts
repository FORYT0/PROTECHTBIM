import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';

// Resolve shared-types lib — works in 3 scenarios:
// 1. Local dev: monorepo root is ../../ from apps/web
// 2. Vercel with root=apps/web: pre-build.js copied libs/ into apps/web/libs/
// 3. Vercel from repo root: monorepo root is ./
const candidates = [
  path.resolve(__dirname, '../../libs/shared-types/src/index.ts'),   // local dev / repo root
  path.resolve(__dirname, './libs/shared-types/src/index.ts'),        // Vercel: pre-build copied
  path.resolve(__dirname, '../../../libs/shared-types/src/index.ts'), // fallback
];
const sharedTypesPath = candidates.find(p => fs.existsSync(p))
  ?? candidates[0]; // default to local dev path if none found yet (build will fail with clear error)

console.log('[vite] shared-types resolved to:', sharedTypesPath);

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@protecht-bim/shared-types': sharedTypesPath,
    },
  },
  server: {
    port: 8081,
    proxy: {
      '/api': { target: 'http://localhost:3000', changeOrigin: true },
    },
  },
  optimizeDeps: {
    exclude: ['web-ifc'],
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('react-dom') || id.includes('react-router')) return 'react-vendor';
          if (id.includes('lucide-react')) return 'ui-vendor';
          if (id.includes('gantt-task-react')) return 'gantt';
          if (id.includes('date-fns')) return 'date-utils';
          if (id.includes('@tanstack/react-query')) return 'query';
          if (id.includes('three') || id.includes('web-ifc')) return 'bim';
          if (id.includes('recharts')) return 'charts';
          if (id.includes('socket.io')) return 'realtime';
        },
      },
    },
    chunkSizeWarningLimit: 1500,
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    css: true,
  },
});

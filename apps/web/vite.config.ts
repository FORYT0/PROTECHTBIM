import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';

// Resolve shared-types lib across all environments:
// 1. Local dev / Railway:  monorepo root is ../../ from apps/web
// 2. Vercel (repo root):   monorepo root is ./
const candidates = [
  path.resolve(__dirname, '../../libs/shared-types/src/index.ts'),
  path.resolve(__dirname, '../../../libs/shared-types/src/index.ts'),
  path.resolve(__dirname, './libs/shared-types/src/index.ts'),
];
const sharedTypesPath =
  candidates.find(p => fs.existsSync(p)) ?? candidates[0];

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
});

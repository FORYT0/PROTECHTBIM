import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

// Resolve the monorepo root — works both locally (2 levels up) and on Vercel
const monorepoRoot = path.resolve(__dirname, '../../');

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@protecht-bim/shared-types': path.resolve(
        monorepoRoot,
        'libs/shared-types/src/index.ts'
      ),
    },
  },
  server: {
    port: 8081,
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
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

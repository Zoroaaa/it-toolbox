import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '127.0.0.1',
    // Proxy API calls to wrangler pages dev server in dev mode
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8788',
        changeOrigin: true,
        rewrite: (p) => p,
      },
    },
  },
  // Include .wasm files as assets so they get correct MIME type
  assetsInclude: ['**/*.wasm'],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@core': path.resolve(__dirname, './packages/core'),
      '@toolbox/types': path.resolve(__dirname, './packages/types'),
      '@it-toolbox/core': path.resolve(__dirname, './packages/core'),
      '@it-toolbox/types': path.resolve(__dirname, './packages/types'),
    },
  },
  optimizeDeps: {
    esbuildOptions: {
      target: 'esnext',
    },
  },
  esbuild: {
    target: 'esnext',
  },
  build: {
    target: 'esnext',
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'router': ['@tanstack/react-router'],
          'crypto-vendor': ['bcryptjs', 'jose'],
          'text-vendor': ['diff', 'fuse.js'],
          'data-vendor': ['papaparse', 'js-yaml', 'sql-formatter'],
        },
      },
    },
  },
})

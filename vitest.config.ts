import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@core': path.resolve(__dirname, './packages/core'),
      '@toolbox/types': path.resolve(__dirname, './packages/types'),
      '@it-toolbox/core': path.resolve(__dirname, './packages/core'),
      '@it-toolbox/types': path.resolve(__dirname, './packages/types'),
    },
  },
  test: {
    environment: 'happy-dom',
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.test.ts'],
    testTimeout: 10000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary'],
      include: ['packages/core/**/*.ts'],
      exclude: ['packages/core/index.ts', 'packages/core/common.ts'],
      thresholds: {
        lines: 85,
        functions: 75,
        branches: 70,
      },
    },
  },
})

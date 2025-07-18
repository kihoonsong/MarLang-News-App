import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.jsx'],
    css: true,
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/tests/e2e/**',
      '**/*.e2e.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
      '**/*.spec.js' // Playwright 테스트 파일 제외
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        'dist/',
        'functions/',
        'tests/',
        '**/*.test.{js,jsx,ts,tsx}',
        '**/*.spec.{js,jsx,ts,tsx}',
        'vite.config.js',
        'vitest.config.js',
        'playwright.config.js',
        '**/*.config.js',
        'src/assets/',
        'public/',
        '**/*.d.ts'
      ],
      include: [
        'src/**/*.{js,jsx,ts,tsx}'
      ],
      thresholds: {
        global: {
          branches: 70,
          functions: 70,
          lines: 70,
          statements: 70
        }
      }
    },
    // Test timeout
    testTimeout: 10000,
    // Hook timeout
    hookTimeout: 10000,
    // Retry failed tests
    retry: 1,
    // Run tests in sequence for better stability
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: true
      }
    },
    // Reduce memory usage
    maxConcurrency: 1
  }
})
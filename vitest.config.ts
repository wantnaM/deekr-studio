import { defineConfig } from 'vitest/config'

import electronViteConfig from './electron.vite.config'

const rendererConfig = electronViteConfig.renderer

export default defineConfig({
  // 复用 renderer 插件和路径别名
  plugins: rendererConfig.plugins,
  resolve: {
    alias: rendererConfig.resolve.alias
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: [],
    include: [
      // 只测试渲染进程
      'src/renderer/**/*.{test,spec}.{ts,tsx}',
      'src/renderer/**/__tests__/**/*.{ts,tsx}'
    ],
    exclude: ['**/node_modules/**', '**/dist/**', '**/out/**', '**/build/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        '**/node_modules/**',
        '**/dist/**',
        '**/out/**',
        '**/build/**',
        '**/coverage/**',
        '**/.yarn/**',
        '**/.cursor/**',
        '**/.vscode/**',
        '**/.github/**',
        '**/.husky/**',
        '**/*.d.ts',
        '**/types/**',
        '**/__tests__/**',
        '**/*.{test,spec}.{ts,tsx}',
        '**/*.config.{js,ts}',
        '**/electron.vite.config.ts',
        '**/vitest.config.ts'
      ]
    },
    testTimeout: 20000,
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: false
      }
    }
  }
})

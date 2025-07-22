/**
 * 後端測試專用的 Vitest 配置
 */

import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./setup.ts'],
    testTimeout: 10000,
    hookTimeout: 10000,
    teardownTimeout: 10000,
    // 測試檔案模式
    include: ['**/*.test.ts'],
    exclude: ['node_modules', 'dist'],
    // 並發設定
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: true, // 資料庫測試使用單執行緒避免競爭條件
      },
    },
    // 覆蓋率設定
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        'dist/',
        '**/*.d.ts',
        '**/*.config.*',
      ],
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, '../../src'),
      '@shared': resolve(__dirname, '../../shared'),
      '@server': resolve(__dirname, '../../server'),
    },
  },
})
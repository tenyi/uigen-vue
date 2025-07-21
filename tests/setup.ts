// 測試環境設定
import { vi } from 'vitest'

// Mock 環境變數
vi.mock('process', () => ({
  env: {
    VITE_APP_NAME: 'UIGen Vue Test',
    VITE_API_BASE_URL: 'http://localhost:3001',
    NODE_ENV: 'test',
  },
}))

// 全域測試設定
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))
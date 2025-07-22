/**
 * 伺服器主檔案測試
 * 測試 Express 伺服器的基本設定與中介軟體
 */

import { describe, it, expect, vi } from 'vitest'
import request from 'supertest'
import { testApp } from './setup'
import express from 'express'
import { setupSwagger } from '../../server/lib/swagger'

describe('伺服器設定', () => {
  describe('基本中介軟體', () => {
    it('應該處理 JSON 請求體', async () => {
      const response = await request(testApp)
        .post('/api/ai/chat')
        .send({ message: '測試訊息' })
        .expect(501) // 目前這個端點回傳 501

      // 確認伺服器能夠解析 JSON
      expect(response.body).toHaveProperty('success', false)
    })

    it('應該設定 CORS 標頭', async () => {
      const response = await request(testApp)
        .get('/health')
        .expect(200)

      // 檢查是否有 CORS 標頭
      expect(response.headers).toHaveProperty('access-control-allow-origin')
    })

    it('應該設定安全標頭', async () => {
      const response = await request(testApp)
        .get('/health')
        .expect(200)

      // 檢查是否有基本的安全標頭
      expect(response.headers).toHaveProperty('x-content-type-options')
    })
  })

  describe('錯誤處理', () => {
    it('應該處理 404 錯誤', async () => {
      const response = await request(testApp)
        .get('/non-existent-route')
        .expect(404)

      expect(response.body).toHaveProperty('error')
    })

    it('應該處理伺服器錯誤', async () => {
      // 這個測試需要模擬伺服器錯誤
      // 在實際應用中，可以使用 mock 來模擬錯誤情況
    })
  })

  describe('Swagger 設定', () => {
    it('應該正確設定 Swagger', () => {
      const mockApp = {
        use: vi.fn(),
        get: vi.fn()
      }

      // 測試 setupSwagger 函數
      setupSwagger(mockApp as unknown as express.Application)

      // 驗證是否正確設定了 Swagger 路由
      // 由於我們修改了 setupSwagger 的實現，現在只使用 .get 方法
      expect(mockApp.get).toHaveBeenCalledWith('/api/docs', expect.anything(), expect.anything())
      expect(mockApp.get).toHaveBeenCalledWith('/api/docs.json', expect.anything())
    })
  })

  describe('環境變數', () => {
    it('應該在測試環境中使用正確的設定', async () => {
      const response = await request(testApp)
        .get('/health')
        .expect(200)

      expect(response.body.environment).toBe('test')
    })
  })
})
/**
 * 健康檢查測試
 * 測試系統健康檢查端點
 */

import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { testApp } from './setup'

describe('Health Check API', () => {
  describe('GET /health', () => {
    it('應該回傳健康狀態', async () => {
      const response = await request(testApp)
        .get('/health')
        .expect(200)

      expect(response.body).toMatchObject({
        status: 'healthy',
        version: expect.any(String),
        environment: 'test',
      })
      expect(response.body).toHaveProperty('timestamp')
      expect(new Date(response.body.timestamp)).toBeInstanceOf(Date)
    })

    it('應該回傳正確的內容類型', async () => {
      const response = await request(testApp)
        .get('/health')
        .expect(200)

      expect(response.headers['content-type']).toMatch(/application\/json/)
    })

    it('應該包含所有必要的健康資訊', async () => {
      const response = await request(testApp)
        .get('/health')
        .expect(200)

      const requiredFields = ['status', 'timestamp', 'version', 'environment']
      
      for (const field of requiredFields) {
        expect(response.body).toHaveProperty(field)
        expect(response.body[field]).toBeDefined()
      }
    })

    it('應該回傳有效的時間戳格式', async () => {
      const response = await request(testApp)
        .get('/health')
        .expect(200)

      const timestamp = response.body.timestamp
      expect(timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
      
      const date = new Date(timestamp)
      expect(date.getTime()).not.toBeNaN()
      
      // 時間戳應該是最近的（在過去 5 秒內）
      const now = new Date()
      const timeDiff = now.getTime() - date.getTime()
      expect(timeDiff).toBeLessThan(5000)
    })

    it('應該在測試環境中回傳正確的環境資訊', async () => {
      const response = await request(testApp)
        .get('/health')
        .expect(200)

      expect(response.body.environment).toBe('test')
    })

    it('應該處理多個並發請求', async () => {
      const requests = Array(10).fill(null).map(() =>
        request(testApp).get('/health')
      )

      const responses = await Promise.all(requests)

      responses.forEach(response => {
        expect(response.status).toBe(200)
        expect(response.body.status).toBe('healthy')
      })
    })

    it('應該快速回應（效能測試）', async () => {
      const startTime = Date.now()
      
      await request(testApp)
        .get('/health')
        .expect(200)
      
      const endTime = Date.now()
      const responseTime = endTime - startTime
      
      // 健康檢查應該在 100ms 內回應
      expect(responseTime).toBeLessThan(100)
    })
  })

  describe('健康檢查安全性', () => {
    it('應該不洩露敏感資訊', async () => {
      const response = await request(testApp)
        .get('/health')
        .expect(200)

      const responseString = JSON.stringify(response.body)
      
      // 檢查不應該包含的敏感資訊
      const sensitivePatterns = [
        /password/i,
        /secret/i,
        /key/i,
        /token/i,
        /database.*url/i,
        /connection.*string/i,
      ]

      sensitivePatterns.forEach(pattern => {
        expect(responseString).not.toMatch(pattern)
      })
    })

    it('應該設定適當的安全標頭', async () => {
      const response = await request(testApp)
        .get('/health')
        .expect(200)

      // 檢查是否有基本的安全標頭（由 helmet 中介軟體設定）
      expect(response.headers).toHaveProperty('x-content-type-options')
      expect(response.headers).toHaveProperty('x-frame-options')
    })
  })

  describe('錯誤處理', () => {
    it('應該處理不支援的 HTTP 方法', async () => {
      await request(testApp)
        .post('/health')
        .expect(404)

      await request(testApp)
        .put('/health')
        .expect(404)

      await request(testApp)
        .delete('/health')
        .expect(404)
    })

    it('應該處理帶有查詢參數的請求', async () => {
      const response = await request(testApp)
        .get('/health?param=value')
        .expect(200)

      expect(response.body.status).toBe('healthy')
    })
  })
})
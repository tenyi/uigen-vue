/**
 * AI 路由測試
 * 測試 AI 相關的 API 端點
 */

import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { testApp } from '../setup'

describe('AI API', () => {
  describe('POST /api/ai/chat', () => {
    it('應該回傳未實現的狀態', async () => {
      const chatData = {
        message: '請幫我建立一個按鈕組件',
        provider: 'anthropic',
      }

      const response = await request(testApp)
        .post('/api/ai/chat')
        .send(chatData)
        .expect(501)

      expect(response.body).toMatchObject({
        success: false,
        message: 'AI chat not implemented yet',
        data: null,
      })
    })

    it('應該處理空的請求體', async () => {
      const response = await request(testApp)
        .post('/api/ai/chat')
        .send({})
        .expect(501)

      expect(response.body).toHaveProperty('success', false)
    })

    it('應該處理無效的 JSON', async () => {
      const response = await request(testApp)
        .post('/api/ai/chat')
        .set('Content-Type', 'application/json')
        .send('invalid json')
        .expect(400)
    })
  })

  describe('GET /api/ai/providers', () => {
    it('應該回傳未實現的狀態', async () => {
      const response = await request(testApp)
        .get('/api/ai/providers')
        .expect(501)

      expect(response.body).toMatchObject({
        success: false,
        message: 'Get AI providers not implemented yet',
        data: null,
      })
    })

    it('應該回傳正確的內容類型', async () => {
      const response = await request(testApp)
        .get('/api/ai/providers')
        .expect(501)

      expect(response.headers['content-type']).toMatch(/application\/json/)
    })
  })

  describe('GET /api/ai/health', () => {
    it('應該回傳未實現的狀態', async () => {
      const response = await request(testApp)
        .get('/api/ai/health')
        .expect(501)

      expect(response.body).toMatchObject({
        success: false,
        message: 'AI providers health check not implemented yet',
        data: null,
      })
    })
  })

  describe('GET /api/ai/usage', () => {
    it('應該回傳未實現的狀態', async () => {
      const response = await request(testApp)
        .get('/api/ai/usage')
        .expect(501)

      expect(response.body).toMatchObject({
        success: false,
        message: 'Get AI usage statistics not implemented yet',
        data: null,
      })
    })
  })

  describe('錯誤處理', () => {
    it('應該處理不存在的端點', async () => {
      const response = await request(testApp)
        .get('/api/ai/nonexistent')
        .expect(404)
    })

    it('應該處理不支援的 HTTP 方法', async () => {
      const response = await request(testApp)
        .delete('/api/ai/chat')
        .expect(404)
    })
  })

  describe('回應格式', () => {
    it('所有端點都應該回傳一致的錯誤格式', async () => {
      const endpoints = [
        '/api/ai/chat',
        '/api/ai/providers',
        '/api/ai/health',
        '/api/ai/usage',
      ]

      for (const endpoint of endpoints) {
        const method = endpoint === '/api/ai/chat' ? 'post' : 'get'
        const response = await request(testApp)[method](endpoint)

        expect(response.body).toHaveProperty('success')
        expect(response.body).toHaveProperty('message')
        expect(response.body).toHaveProperty('data')
        expect(typeof response.body.success).toBe('boolean')
        expect(typeof response.body.message).toBe('string')
      }
    })

    it('應該設定正確的 HTTP 標頭', async () => {
      const response = await request(testApp)
        .get('/api/ai/providers')
        .expect(501)

      expect(response.headers['content-type']).toMatch(/application\/json/)
      // 移除 X-Powered-By 檢查，因為 helmet 已將其移除
      expect(response.headers).toHaveProperty('x-content-type-options')
    })
  })

  describe('安全性測試', () => {
    it('應該拒絕過大的請求體', async () => {
      const largeData = {
        message: 'a'.repeat(20 * 1024 * 1024), // 20MB 的資料
        provider: 'anthropic',
      }

      const response = await request(testApp)
        .post('/api/ai/chat')
        .send(largeData)

      // 應該被中介軟體拒絕，而不是到達路由處理器
      expect(response.status).toBeOneOf([413, 400, 500])
    })

    it('應該清理輸入資料', async () => {
      const maliciousData = {
        message: '<script>alert("xss")</script>',
        provider: 'anthropic',
      }

      const response = await request(testApp)
        .post('/api/ai/chat')
        .send(maliciousData)
        .expect(501)

      // 即使是 501 回應，也不應該包含原始的惡意腳本
      expect(JSON.stringify(response.body)).not.toContain('<script>')
    })
  })
})
/**
 * Swagger API 文件測試
 * 測試 Swagger API 文件生成與路由
 */

import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { testApp } from './setup'
import { swaggerSpec } from '../../server/lib/swagger'

describe('Swagger API Documentation', () => {
  describe('GET /api/docs', () => {
    it('應該提供 Swagger UI 頁面', async () => {
      const response = await request(testApp)
        .get('/api/docs')
        .expect(200)

      // Swagger UI 頁面應該是 HTML 格式
      expect(response.headers['content-type']).toMatch(/text\/html/)
      expect(response.text).toContain('swagger')
    })

    it('應該設定正確的安全標頭', async () => {
      const response = await request(testApp)
        .get('/api/docs')
        .expect(200)

      // 檢查是否有基本的安全標頭
      expect(response.headers).toHaveProperty('x-content-type-options')
    })
  })

  describe('GET /api/docs.json', () => {
    it('應該提供 OpenAPI JSON 規格', async () => {
      const response = await request(testApp)
        .get('/api/docs.json')
        .expect(200)

      // 應該是 JSON 格式
      expect(response.headers['content-type']).toMatch(/application\/json/)
      
      // 檢查基本的 OpenAPI 結構
      expect(response.body).toHaveProperty('openapi')
      expect(response.body).toHaveProperty('info')
      expect(response.body).toHaveProperty('paths')
      expect(response.body).toHaveProperty('components')
    })

    it('應該包含所有已定義的路由', async () => {
      const response = await request(testApp)
        .get('/api/docs.json')
        .expect(200)

      // 檢查是否包含主要 API 路徑
      const paths = response.body.paths
      expect(paths).toBeDefined()
      
      // 檢查是否包含健康檢查端點
      expect(paths).toHaveProperty('/health')
      
      // 檢查是否包含 API 端點
      expect(Object.keys(paths).some(path => path.startsWith('/api/'))).toBe(true)
    })
  })

  describe('Swagger 規格', () => {
    it('應該包含所有必要的組件定義', () => {
      // 檢查 Swagger 規格是否包含所有必要的組件定義
      expect(swaggerSpec.components.schemas).toHaveProperty('Project')
      expect(swaggerSpec.components.schemas).toHaveProperty('File')
      expect(swaggerSpec.components.schemas).toHaveProperty('AIRequest')
      expect(swaggerSpec.components.schemas).toHaveProperty('Error')
    })

    it('應該包含所有必要的回應定義', () => {
      // 檢查 Swagger 規格是否包含所有必要的回應定義
      expect(swaggerSpec.components.responses).toHaveProperty('BadRequest')
      expect(swaggerSpec.components.responses).toHaveProperty('NotFound')
      expect(swaggerSpec.components.responses).toHaveProperty('InternalServerError')
    })

    it('應該包含安全性定義', () => {
      // 檢查 Swagger 規格是否包含安全性定義
      expect(swaggerSpec.components.securitySchemes).toHaveProperty('BearerAuth')
    })
  })

  describe('安全性測試', () => {
    it('應該不洩露敏感資訊', async () => {
      const response = await request(testApp)
        .get('/api/docs.json')
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
        // 只檢查 servers 和 info 部分，因為其他部分可能合法地包含這些詞
        const infoAndServers = JSON.stringify({
          info: response.body.info,
          servers: response.body.servers
        })
        expect(infoAndServers).not.toMatch(pattern)
      })
    })
  })
})
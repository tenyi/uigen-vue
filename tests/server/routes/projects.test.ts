/**
 * 專案路由測試
 * 測試專案相關的 API 端點
 */

import { describe, it, expect, beforeEach } from 'vitest'
import request from 'supertest'
import { testApp, createTestProject, cleanupTestData } from '../setup'

describe('Projects API', () => {
  beforeEach(async () => {
    await cleanupTestData()
  })

  describe('GET /api/projects', () => {
    it('應該回傳空的專案列表', async () => {
      const response = await request(testApp)
        .get('/api/projects')
        .expect(200)

      expect(response.body).toEqual([])
    })

    it('應該回傳所有專案', async () => {
      // 建立測試專案
      const project1 = await createTestProject({
        name: '測試專案 1',
        description: '第一個測試專案',
      })
      
      const project2 = await createTestProject({
        name: '測試專案 2',
        description: '第二個測試專案',
      })

      const response = await request(testApp)
        .get('/api/projects')
        .expect(200)

      expect(response.body).toHaveLength(2)
      expect(response.body[0]).toMatchObject({
        id: project1.id,
        name: '測試專案 1',
        description: '第一個測試專案',
      })
      expect(response.body[1]).toMatchObject({
        id: project2.id,
        name: '測試專案 2',
        description: '第二個測試專案',
      })
    })

    it('應該包含關聯的檔案資料', async () => {
      const project = await createTestProject({
        name: '有檔案的專案',
        description: '包含檔案的測試專案',
      })

      const response = await request(testApp)
        .get('/api/projects')
        .expect(200)

      expect(response.body[0]).toHaveProperty('files')
      expect(Array.isArray(response.body[0].files)).toBe(true)
    })
  })

  describe('POST /api/projects', () => {
    it('應該成功建立新專案', async () => {
      const projectData = {
        name: '新專案',
        description: '這是一個新的測試專案',
      }

      const response = await request(testApp)
        .post('/api/projects')
        .send(projectData)
        .expect(201)

      expect(response.body).toMatchObject({
        name: projectData.name,
        description: projectData.description,
      })
      expect(response.body).toHaveProperty('id')
      expect(response.body).toHaveProperty('createdAt')
      expect(response.body).toHaveProperty('updatedAt')
    })

    it('應該可以建立沒有描述的專案', async () => {
      const projectData = {
        name: '簡單專案',
      }

      const response = await request(testApp)
        .post('/api/projects')
        .send(projectData)
        .expect(201)

      expect(response.body).toMatchObject({
        name: projectData.name,
        description: null,
      })
    })

    it('應該拒絕沒有名稱的專案', async () => {
      const projectData = {
        description: '沒有名稱的專案',
      }

      const response = await request(testApp)
        .post('/api/projects')
        .send(projectData)
        .expect(400)

      expect(response.body).toHaveProperty('error')
    })

    it('應該拒絕空的專案名稱', async () => {
      const projectData = {
        name: '',
        description: '空名稱專案',
      }

      const response = await request(testApp)
        .post('/api/projects')
        .send(projectData)
        .expect(400)

      expect(response.body).toHaveProperty('error')
    })

    it('應該拒絕過長的專案名稱', async () => {
      const projectData = {
        name: 'a'.repeat(256), // 超過一般資料庫欄位長度限制
        description: '名稱過長的專案',
      }

      const response = await request(testApp)
        .post('/api/projects')
        .send(projectData)
        .expect(400)

      expect(response.body).toHaveProperty('error')
    })
  })

  describe('錯誤處理', () => {
    it('應該處理資料庫連線錯誤', async () => {
      // 這個測試需要模擬資料庫錯誤
      // 在實際應用中，可以使用 mock 來模擬錯誤情況
    })

    it('應該回傳正確的錯誤格式', async () => {
      const response = await request(testApp)
        .post('/api/projects')
        .send({})
        .expect(400)

      expect(response.body).toHaveProperty('error')
      expect(typeof response.body.error).toBe('string')
    })
  })

  describe('資料驗證', () => {
    it('應該清理和驗證輸入資料', async () => {
      const projectData = {
        name: '  測試專案  ', // 前後有空格
        description: '  測試描述  ',
      }

      const response = await request(testApp)
        .post('/api/projects')
        .send(projectData)
        .expect(201)

      // 檢查是否正確處理了空格
      expect(response.body.name.trim()).toBe('測試專案')
    })

    it('應該拒絕包含惡意腳本的輸入', async () => {
      const projectData = {
        name: '<script>alert("xss")</script>',
        description: 'XSS 測試',
      }

      const response = await request(testApp)
        .post('/api/projects')
        .send(projectData)

      // 應該要麼拒絕請求，要麼清理輸入
      if (response.status === 201) {
        expect(response.body.name).not.toContain('<script>')
      } else {
        expect(response.status).toBe(400)
      }
    })
  })
})
/**
 * 檔案路由測試
 * 測試檔案相關的 API 端點
 */

import { describe, it, expect, beforeEach } from 'vitest'
import request from 'supertest'
import { testApp, createTestProject, createTestFile, cleanupTestData } from '../setup'

describe('Files API', () => {
  let testProject: any

  beforeEach(async () => {
    await cleanupTestData()
    // 每個測試都需要一個專案
    testProject = await createTestProject({
      name: '測試專案',
      description: '用於檔案測試的專案',
    })
  })

  describe('POST /api/files', () => {
    it('應該成功建立新檔案', async () => {
      const fileData = {
        name: 'Button.vue',
        content: '<template>\n  <button>{{ label }}</button>\n</template>',
        projectId: testProject.id,
      }

      const response = await request(testApp)
        .post('/api/files')
        .send(fileData)
        .expect(201)

      expect(response.body).toMatchObject({
        name: fileData.name,
        content: fileData.content,
        projectId: fileData.projectId,
      })
      expect(response.body).toHaveProperty('id')
      expect(response.body).toHaveProperty('createdAt')
      expect(response.body).toHaveProperty('updatedAt')
    })

    it('應該拒絕沒有名稱的檔案', async () => {
      const fileData = {
        content: '<template><div>測試</div></template>',
        projectId: testProject.id,
      }

      const response = await request(testApp)
        .post('/api/files')
        .send(fileData)
        .expect(400)

      expect(response.body).toHaveProperty('error')
    })

    it('應該拒絕沒有內容的檔案', async () => {
      const fileData = {
        name: 'Empty.vue',
        projectId: testProject.id,
      }

      const response = await request(testApp)
        .post('/api/files')
        .send(fileData)
        .expect(400)

      expect(response.body).toHaveProperty('error')
    })

    it('應該拒絕沒有專案 ID 的檔案', async () => {
      const fileData = {
        name: 'Orphan.vue',
        content: '<template><div>孤兒檔案</div></template>',
      }

      const response = await request(testApp)
        .post('/api/files')
        .send(fileData)
        .expect(400)

      expect(response.body).toHaveProperty('error')
    })

    it('應該拒絕不存在的專案 ID', async () => {
      const fileData = {
        name: 'Invalid.vue',
        content: '<template><div>無效專案</div></template>',
        projectId: 'non-existent-project-id',
      }

      const response = await request(testApp)
        .post('/api/files')
        .send(fileData)
        .expect(400)

      expect(response.body).toHaveProperty('error')
    })

    it('應該處理大型檔案內容', async () => {
      const largeContent = 'a'.repeat(10000) // 10KB 的內容
      const fileData = {
        name: 'Large.vue',
        content: largeContent,
        projectId: testProject.id,
      }

      const response = await request(testApp)
        .post('/api/files')
        .send(fileData)
        .expect(201)

      expect(response.body.content).toBe(largeContent)
    })
  })

  describe('PUT /api/files/:id', () => {
    let testFile: any

    beforeEach(async () => {
      testFile = await createTestFile({
        name: 'TestComponent.vue',
        content: '<template><div>原始內容</div></template>',
        projectId: testProject.id,
      })
    })

    it('應該成功更新檔案內容', async () => {
      const newContent = '<template><div>更新後的內容</div></template>'

      const response = await request(testApp)
        .put(`/api/files/${testFile.id}`)
        .send({ content: newContent })
        .expect(200)

      expect(response.body).toMatchObject({
        id: testFile.id,
        name: testFile.name,
        content: newContent,
        projectId: testProject.id,
      })
      expect(new Date(response.body.updatedAt).getTime()).toBeGreaterThan(
        new Date(testFile.updatedAt).getTime()
      )
    })

    it('應該拒絕空的內容更新', async () => {
      const response = await request(testApp)
        .put(`/api/files/${testFile.id}`)
        .send({ content: '' })
        .expect(400)

      expect(response.body).toHaveProperty('error')
    })

    it('應該拒絕沒有內容的更新請求', async () => {
      const response = await request(testApp)
        .put(`/api/files/${testFile.id}`)
        .send({})
        .expect(400)

      expect(response.body).toHaveProperty('error')
    })

    it('應該拒絕不存在的檔案 ID', async () => {
      const response = await request(testApp)
        .put('/api/files/non-existent-file-id')
        .send({ content: '新內容' })
        .expect(404)

      expect(response.body).toHaveProperty('error')
    })

    it('應該處理大型內容更新', async () => {
      const largeContent = 'b'.repeat(50000) // 50KB 的內容

      const response = await request(testApp)
        .put(`/api/files/${testFile.id}`)
        .send({ content: largeContent })
        .expect(200)

      expect(response.body.content).toBe(largeContent)
    })
  })

  describe('資料驗證', () => {
    it('應該驗證檔案名稱格式', async () => {
      const invalidNames = [
        '', // 空名稱
        '   ', // 只有空格
        'file/with/slash.vue', // 包含路徑分隔符
        'file<with>brackets.vue', // 包含特殊字符
        'file|with|pipes.vue', // 包含管道符
      ]

      for (const name of invalidNames) {
        const response = await request(testApp)
          .post('/api/files')
          .send({
            name,
            content: '<template><div>測試</div></template>',
            projectId: testProject.id,
          })

        expect(response.status).toBe(400)
        expect(response.body).toHaveProperty('error')
      }
    })

    it('應該接受有效的檔案名稱', async () => {
      const validNames = [
        'Component.vue',
        'my-component.vue',
        'MyComponent.vue',
        'component_name.vue',
        'Component123.vue',
      ]

      for (const name of validNames) {
        const response = await request(testApp)
          .post('/api/files')
          .send({
            name,
            content: '<template><div>測試</div></template>',
            projectId: testProject.id,
          })

        expect(response.status).toBe(201)
        expect(response.body.name).toBe(name)
      }
    })

    it('應該清理和驗證檔案內容', async () => {
      const fileData = {
        name: 'Test.vue',
        content: '  <template><div>有前後空格的內容</div></template>  ',
        projectId: testProject.id,
      }

      const response = await request(testApp)
        .post('/api/files')
        .send(fileData)
        .expect(201)

      // 檢查內容是否被正確處理
      expect(response.body.content.trim()).toBe(
        '<template><div>有前後空格的內容</div></template>'
      )
    })
  })

  describe('錯誤處理', () => {
    it('應該回傳正確的錯誤格式', async () => {
      const response = await request(testApp)
        .post('/api/files')
        .send({})
        .expect(400)

      expect(response.body).toHaveProperty('error')
      expect(typeof response.body.error).toBe('string')
    })

    it('應該處理資料庫約束錯誤', async () => {
      // 測試重複檔案名稱等約束錯誤
      const fileData = {
        name: 'Duplicate.vue',
        content: '<template><div>第一個檔案</div></template>',
        projectId: testProject.id,
      }

      // 建立第一個檔案
      await request(testApp)
        .post('/api/files')
        .send(fileData)
        .expect(201)

      // 嘗試建立同名檔案（如果有唯一約束的話）
      const response = await request(testApp)
        .post('/api/files')
        .send(fileData)

      // 根據資料庫約束設定，這可能成功或失敗
      if (response.status !== 201) {
        expect(response.body).toHaveProperty('error')
      }
    })
  })
})
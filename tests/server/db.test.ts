/**
 * 資料庫連線測試
 * 測試 Prisma 資料庫連線與基本操作
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { testPrisma, cleanupTestData } from './setup'

describe('資料庫連線', () => {
  beforeEach(async () => {
    await cleanupTestData()
  })

  it('應該能夠連線到測試資料庫', async () => {
    // 簡單查詢以確認連線
    const result = await testPrisma.$queryRaw`SELECT 1 as test`
    expect(result).toBeDefined()
  })

  describe('Project 模型', () => {
    it('應該能夠建立和查詢專案', async () => {
      // 建立測試專案
      const projectName = `測試專案-${Date.now()}`
      const project = await testPrisma.project.create({
        data: {
          name: projectName,
          description: '資料庫測試專案',
        },
      })

      // 查詢剛建立的專案
      const foundProject = await testPrisma.project.findUnique({
        where: { id: project.id },
      })

      expect(foundProject).toBeDefined()
      expect(foundProject?.name).toBe(projectName)
      expect(foundProject?.description).toBe('資料庫測試專案')

      // 清理測試資料
      await testPrisma.project.delete({
        where: { id: project.id },
      })
    })

    it('應該能夠更新專案', async () => {
      // 建立測試專案
      const project = await testPrisma.project.create({
        data: {
          name: `更新測試-${Date.now()}`,
          description: '原始描述',
        },
      })

      // 更新專案
      const updatedProject = await testPrisma.project.update({
        where: { id: project.id },
        data: { description: '更新後的描述' },
      })

      expect(updatedProject.description).toBe('更新後的描述')

      // 清理測試資料
      await testPrisma.project.delete({
        where: { id: project.id },
      })
    })

    it('應該能夠刪除專案', async () => {
      // 建立測試專案
      const project = await testPrisma.project.create({
        data: {
          name: `刪除測試-${Date.now()}`,
          description: '將被刪除的專案',
        },
      })

      // 刪除專案
      await testPrisma.project.delete({
        where: { id: project.id },
      })

      // 嘗試查詢已刪除的專案
      const foundProject = await testPrisma.project.findUnique({
        where: { id: project.id },
      })

      expect(foundProject).toBeNull()
    })
  })

  describe('File 模型', () => {
    let testProject: any

    beforeAll(async () => {
      // 建立測試專案
      testProject = await testPrisma.project.create({
        data: {
          name: `檔案測試專案-${Date.now()}`,
          description: '用於檔案測試的專案',
        },
      })
    })

    afterAll(async () => {
      // 清理測試專案
      await testPrisma.project.delete({
        where: { id: testProject.id },
      })
    })

    it('應該能夠建立和查詢檔案', async () => {
      // 建立測試檔案
      const file = await testPrisma.file.create({
        data: {
          name: 'TestFile.vue',
          content: '<template><div>測試內容</div></template>',
          projectId: testProject.id,
        },
      })

      // 查詢剛建立的檔案
      const foundFile = await testPrisma.file.findUnique({
        where: { id: file.id },
      })

      expect(foundFile).toBeDefined()
      expect(foundFile?.name).toBe('TestFile.vue')
      expect(foundFile?.content).toBe('<template><div>測試內容</div></template>')
      expect(foundFile?.projectId).toBe(testProject.id)

      // 清理測試資料
      await testPrisma.file.delete({
        where: { id: file.id },
      })
    })

    it('應該能夠更新檔案內容', async () => {
      // 建立測試檔案
      const file = await testPrisma.file.create({
        data: {
          name: 'UpdateTest.vue',
          content: '原始內容',
          projectId: testProject.id,
        },
      })

      // 更新檔案
      const updatedFile = await testPrisma.file.update({
        where: { id: file.id },
        data: { content: '更新後的內容' },
      })

      expect(updatedFile.content).toBe('更新後的內容')

      // 清理測試資料
      await testPrisma.file.delete({
        where: { id: file.id },
      })
    })

    it('應該能夠查詢專案的所有檔案', async () => {
      // 建立多個測試檔案
      await testPrisma.file.createMany({
        data: [
          {
            name: 'File1.vue',
            content: '內容 1',
            projectId: testProject.id,
          },
          {
            name: 'File2.vue',
            content: '內容 2',
            projectId: testProject.id,
          },
        ],
      })

      // 查詢專案的所有檔案
      const files = await testPrisma.file.findMany({
        where: { projectId: testProject.id },
      })

      expect(files.length).toBeGreaterThanOrEqual(2)

      // 清理測試資料
      await testPrisma.file.deleteMany({
        where: { projectId: testProject.id },
      })
    })
  })

  describe('關聯查詢', () => {
    it('應該能夠查詢專案及其檔案', async () => {
      // 建立測試專案
      const project = await testPrisma.project.create({
        data: {
          name: `關聯測試-${Date.now()}`,
          description: '用於測試關聯查詢',
          files: {
            create: [
              {
                name: 'Component1.vue',
                content: '組件 1 內容',
              },
              {
                name: 'Component2.vue',
                content: '組件 2 內容',
              },
            ],
          },
        },
      })

      // 查詢專案及其檔案
      const projectWithFiles = await testPrisma.project.findUnique({
        where: { id: project.id },
        include: { files: true },
      })

      expect(projectWithFiles).toBeDefined()
      expect(projectWithFiles?.files).toHaveLength(2)
      expect(projectWithFiles?.files[0].name).toMatch(/Component\d\.vue/)
      expect(projectWithFiles?.files[1].name).toMatch(/Component\d\.vue/)

      // 清理測試資料
      await testPrisma.file.deleteMany({
        where: { projectId: project.id },
      })
      await testPrisma.project.delete({
        where: { id: project.id },
      })
    })
  })
})
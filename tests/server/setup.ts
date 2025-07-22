/**
 * 後端測試設定檔
 * 配置測試環境和共用工具
 */

import { beforeAll, afterAll, beforeEach, afterEach } from 'vitest'
import { PrismaClient } from '@prisma/client'
import { Server } from '../../server/index'
import type { Express } from 'express'
import path from 'path'

// 計算測試資料庫的絕對路徑 - 統一使用 prisma/test.db
const testDbPath = path.join(process.cwd(), 'prisma', 'test.db')

// 測試用的 Prisma 客戶端
export const testPrisma = new PrismaClient({
  datasources: {
    db: {
      url: `file:${testDbPath}`
    }
  }
})

// 測試用的伺服器實例
let testServer: Server
let testApp: any // 修正為 any 以避免 Express 類型問題

/**
 * 全域測試設定
 */
beforeAll(async () => {
  // 設定測試環境變數
  process.env.NODE_ENV = 'test'
  process.env.DATABASE_URL = `file:${testDbPath}`
  process.env.JWT_SECRET = 'test-jwt-secret'
  process.env.PORT = '3002'

  // 建立測試伺服器
  testServer = new Server()
  testApp = testServer.getApp()

  // 初始化測試資料庫
  await testPrisma.$connect()
  
  // 推送資料庫架構
  try {
    await testPrisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "Project" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "name" TEXT NOT NULL,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL,
        "description" TEXT
      );
    `
    
    await testPrisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "File" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "name" TEXT NOT NULL,
        "content" TEXT NOT NULL,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL,
        "projectId" TEXT NOT NULL,
        FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE
      );
    `
    
    await testPrisma.$executeRaw`
      CREATE UNIQUE INDEX IF NOT EXISTS "File_projectId_name_key" ON "File"("projectId", "name");
    `
    
    console.log('🗄️  Test database schema created')
  } catch (error) {
    console.log('⚠️  Test database schema already exists or error occurred:', error)
  }
  
  console.log('🧪 Test environment initialized')
})

/**
 * 全域測試清理
 */
afterAll(async () => {
  // 清理測試資料庫
  await testPrisma.$disconnect()
  
  console.log('🧹 Test environment cleaned up')
})

/**
 * 每個測試前的設定
 */
beforeEach(async () => {
  // 清空測試資料庫 - 確保每個測試都從乾淨狀態開始
  await cleanupTestData()
})

/**
 * 每個測試後的清理
 */
afterEach(async () => {
  // 再次清理，確保測試間不互相影響
  await cleanupTestData()
})

/**
 * 匯出測試工具
 */
export { testApp, testServer }

/**
 * 建立測試專案的輔助函數
 */
export async function createTestProject(data: {
  name: string
  description?: string
}) {
  return await testPrisma.project.create({
    data: {
      name: data.name,
      description: data.description || null,
    },
  })
}

/**
 * 建立測試檔案的輔助函數
 */
export async function createTestFile(data: {
  name: string
  content: string
  projectId: string
}) {
  return await testPrisma.file.create({
    data: {
      name: data.name,
      content: data.content,
      projectId: data.projectId,
    },
  })
}

/**
 * 清理測試資料的輔助函數
 */
export async function cleanupTestData() {
  try {
    // 確保使用正確的資料庫連線
    await testPrisma.$connect();
    
    // 首先清理檔案（因為有外鍵約束）
    await testPrisma.file.deleteMany({})
    // 然後清理專案
    await testPrisma.project.deleteMany({})
    
    console.log('✅ Test data cleaned up successfully')
  } catch (error) {
    console.error('❌ Failed to cleanup test data:', error)
    // 如果常規清理失敗，嘗試強制清理
    try {
      await testPrisma.$executeRaw`DELETE FROM File`
      await testPrisma.$executeRaw`DELETE FROM Project`
      
      // 重設 autoincrement（如果有的話）
      await testPrisma.$executeRaw`DELETE FROM sqlite_sequence WHERE name='Project'`
      await testPrisma.$executeRaw`DELETE FROM sqlite_sequence WHERE name='File'`
      
      console.log('✅ Force cleanup completed')
    } catch (forceError) {
      console.error('❌ Force cleanup also failed:', forceError)
      throw forceError
    }
  }
}
#!/usr/bin/env node

// 簡單的測試驗證腳本

import { testPrisma, cleanupTestData } from './tests/server/setup.js';

async function runTest() {
  console.log('🧪 開始測試修復...');
  
  try {
    // 清理測試資料
    await cleanupTestData();
    
    // 檢查資料庫是否為空
    const projects = await testPrisma.project.findMany();
    console.log(`📊 專案數量: ${projects.length}`);
    
    if (projects.length === 0) {
      console.log('✅ 測試通過：資料庫已清理');
    } else {
      console.log('❌ 測試失敗：資料庫仍有資料');
    }
    
    // 測試建立專案
    const newProject = await testPrisma.project.create({
      data: {
        name: '測試專案',
        description: '這是一個測試專案'
      }
    });
    
    console.log('✅ 測試通過：專案建立成功', newProject.id);
    
    // 再次清理
    await cleanupTestData();
    
    const finalProjects = await testPrisma.project.findMany();
    console.log(`📊 清理後專案數量: ${finalProjects.length}`);
    
    await testPrisma.$disconnect();
    
  } catch (error) {
    console.error('❌ 測試失敗:', error);
  }
}

runTest();

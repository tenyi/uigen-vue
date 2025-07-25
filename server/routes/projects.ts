
// server/routes/projects.ts

import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

// 建立 Prisma 客戶端實例
// 用於與資料庫進行互動
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

// 建立 Express 路由器實例
// 用於定義專案相關的 API 路由
const router = Router();

/**
 * @swagger
 * tags:
 *   name: Projects
 *   description: 專案管理 API
 */

/**
 * @swagger
 * /api/projects:
 *   get:
 *     summary: 取得所有專案
 *     tags: [Projects]
 *     responses:
 *       200:
 *         description: 成功取得專案列表
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Project'
 */
// GET /api/projects - 取得所有專案
router.get('/', async (_req, res) => {
  try {
    // 從資料庫中查詢所有專案
    const projects = await prisma.project.findMany({
      include: {
        files: true, // 同時載入關聯的檔案
      },
    });
    // 以 JSON 格式回傳專案列表
    res.json(projects);
  } catch (error) {
    // 處理錯誤情況
    res.status(500).json({ error: '無法取得專案' });
  }
});

/**
 * @swagger
 * /api/projects:
 *   post:
 *     summary: 建立新專案
 *     tags: [Projects]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: 專案建立成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Project'
 */
// POST /api/projects - 建立新專案
router.post('/', async (req, res) => {
  try {
    // 從請求主體中獲取專案名稱和描述
    const { name, description } = req.body;
    
    // 輸入驗證
    if (name === undefined || name === null) {
      return res.status(400).json({ error: '專案名稱為必填項目' });
    }
    
    if (typeof name !== 'string') {
      return res.status(400).json({ error: '專案名稱必須為字串' });
    }
    
    // 清理和驗證名稱
    const cleanName = name.trim();
    
    // 檢查空字串
    if (cleanName.length === 0) {
      return res.status(400).json({ error: '專案名稱不能為空' });
    }
    
    // 檢查長度限制
    if (cleanName.length > 255) {
      return res.status(400).json({ error: '專案名稱過長，最多 255 個字元' });
    }
    
    // XSS 防護 - 清理惡意腳本
    const sanitizedName = cleanName.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    const sanitizedDescription = description ? 
      String(description).replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') : 
      null;
    
    // 在資料庫中建立新專案
    const newProject = await prisma.project.create({
      data: {
        name: sanitizedName,
        description: sanitizedDescription,
      },
    });
    // 以 201 Created 狀態碼回傳新建立的專案
    res.status(201).json(newProject);
  } catch (error: any) {
    console.error('建立專案錯誤:', error);
    // 處理錯誤情況
    res.status(400).json({ error: '無法建立專案' });
  }
});

export default router;

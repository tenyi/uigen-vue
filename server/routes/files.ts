
// server/routes/files.ts

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
// 用於定義檔案相關的 API 路由
const router = Router();

/**
 * @swagger
 * tags:
 *   name: Files
 *   description: 檔案管理 API
 */

/**
 * @swagger
 * /api/files:
 *   post:
 *     summary: 建立新檔案
 *     tags: [Files]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               content:
 *                 type: string
 *               projectId:
 *                 type: string
 *     responses:
 *       201:
 *         description: 檔案建立成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/File'
 */
// POST /api/files - 建立新檔案
router.post('/', async (req, res) => {
  try {
    // 從請求主體中獲取檔案名稱、內容和專案 ID
    const { name, content, projectId } = req.body;
    
    // 輸入驗證
    if (!name || typeof name !== 'string' || name.trim() === '') {
      return res.status(400).json({ error: '檔案名稱為必填項目且必須為字串' });
    }
    
    if (typeof content !== 'string') {
      return res.status(400).json({ error: '檔案內容必須為字串' });
    }
    
    if (!projectId || typeof projectId !== 'string') {
      return res.status(400).json({ error: '專案 ID 為必填項目且必須為字串' });
    }

    // 驗證檔案名稱格式（不允許路徑分隔符和特殊字符）
    const invalidNameChars = /[<>:"/\\|?*]/;
    if (invalidNameChars.test(name)) {
      return res.status(400).json({ error: '檔案名稱包含無效字符' });
    }

    // 檢查專案是否存在
    const project = await prisma.project.findUnique({
      where: { id: projectId }
    });
    
    if (!project) {
      return res.status(400).json({ error: '指定的專案不存在' });
    }
    
    // 在資料庫中建立新檔案
    const newFile = await prisma.file.create({
      data: {
        name: name.trim(),
        content,
        projectId,
      },
    });
    // 以 201 Created 狀態碼回傳新建立的檔案
    res.status(201).json(newFile);
  } catch (error: any) {
    console.error('建立檔案錯誤:', error);
    // 處理錯誤情況
    res.status(400).json({ error: '無法建立檔案' });
  }
});

/**
 * @swagger
 * /api/files/{id}:
 *   put:
 *     summary: 更新檔案內容
 *     tags: [Files]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: 檔案 ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               content:
 *                 type: string
 *     responses:
 *       200:
 *         description: 檔案更新成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/File'
 */
// PUT /api/files/:id - 更新檔案內容
router.put('/:id', async (req, res) => {
  try {
    // 從請求參數中獲取檔案 ID
    const { id } = req.params;
    // 從請求主體中獲取新的檔案內容
    const { content } = req.body;
    
    // 輸入驗證
    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: '檔案 ID 為必填項目且必須為字串' });
    }
    
    if (typeof content !== 'string') {
      return res.status(400).json({ error: '檔案內容必須為字串' });
    }
    
    // 在資料庫中更新指定 ID 的檔案
    const updatedFile = await prisma.file.update({
      where: { id },
      data: { content },
    });
    // 以 JSON 格式回傳更新後的檔案
    res.json(updatedFile);
  } catch (error: any) {
    console.error('更新檔案錯誤:', error);
    // 處理錯誤情況 - 區分不同類型的錯誤
    if (error?.code === 'P2025') {
      return res.status(404).json({ error: '找不到指定的檔案' });
    }
    res.status(400).json({ error: '無法更新檔案' });
  }
});

export default router;

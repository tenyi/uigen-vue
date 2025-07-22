/**
 * Swagger 文件範例
 * 展示如何使用 JSDoc 註解生成 API 文件
 */

import { Router } from 'express'

// 定義路由群組標籤
/**
 * @swagger
 * tags:
 *   name: Examples
 *   description: API 文件範例端點
 */

const router = Router()

/**
 * @swagger
 * /api/examples:
 *   get:
 *     summary: 獲取範例列表
 *     description: 返回所有可用的範例項目
 *     tags: [Examples]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: 限制返回的項目數量
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *         description: 分頁偏移量
 *     responses:
 *       200:
 *         description: 成功獲取範例列表
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         example: ex_123456
 *                       name:
 *                         type: string
 *                         example: 範例項目
 *                       description:
 *                         type: string
 *                         example: 這是一個範例項目的描述
 *       400:
 *         description: 請求參數錯誤
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: 伺服器錯誤
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/', (req, res) => {
  const limit = parseInt(req.query.limit as string) || 10
  const offset = parseInt(req.query.offset as string) || 0

  // 使用 limit 和 offset 進行分頁（這裡只是示例）
  const allData = [
    {
      id: 'ex_123456',
      name: '範例項目 1',
      description: '這是第一個範例項目',
    },
    {
      id: 'ex_789012',
      name: '範例項目 2',
      description: '這是第二個範例項目',
    },
  ]

  const paginatedData = allData.slice(offset, offset + limit)

  res.json({
    success: true,
    data: paginatedData,
    pagination: {
      limit,
      offset,
      total: allData.length,
    },
  })
})

/**
 * @swagger
 * /api/examples/{id}:
 *   get:
 *     summary: 獲取單個範例
 *     description: 根據 ID 獲取特定範例項目的詳細資訊
 *     tags: [Examples]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 範例項目 ID
 *     responses:
 *       200:
 *         description: 成功獲取範例項目
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: ex_123456
 *                     name:
 *                       type: string
 *                       example: 範例項目
 *                     description:
 *                       type: string
 *                       example: 這是一個範例項目的詳細描述
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                       example: 2024-01-21T10:30:00.000Z
 *       404:
 *         description: 範例項目不存在
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: 伺服器錯誤
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:id', (req, res) => {
  const { id } = req.params

  if (id === 'ex_123456') {
    res.json({
      success: true,
      data: {
        id: 'ex_123456',
        name: '範例項目 1',
        description: '這是第一個範例項目的詳細描述',
        createdAt: '2024-01-21T10:30:00.000Z',
      },
    })
  } else {
    res.status(404).json({
      success: false,
      error: 'NotFound',
      message: '找不到指定的範例項目',
    })
  }
})

/**
 * @swagger
 * /api/examples:
 *   post:
 *     summary: 建立新範例
 *     description: 建立一個新的範例項目
 *     tags: [Examples]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 example: 新範例項目
 *               description:
 *                 type: string
 *                 example: 這是一個新建立的範例項目
 *     responses:
 *       201:
 *         description: 成功建立範例項目
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: ex_123456
 *                     name:
 *                       type: string
 *                       example: 新範例項目
 *                     description:
 *                       type: string
 *                       example: 這是一個新建立的範例項目
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                       example: 2024-01-21T10:30:00.000Z
 *       400:
 *         description: 請求參數錯誤
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: 伺服器錯誤
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/', (req, res) => {
  const { name, description } = req.body

  if (!name) {
    return res.status(400).json({
      success: false,
      error: 'ValidationError',
      message: '名稱是必填欄位',
    })
  }

  res.status(201).json({
    success: true,
    data: {
      id: `ex_${Date.now()}`,
      name,
      description: description || '',
      createdAt: new Date().toISOString(),
    },
  })
})

/**
 * @swagger
 * /api/examples/{id}:
 *   put:
 *     summary: 更新範例
 *     description: 更新現有範例項目的資訊
 *     tags: [Examples]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 範例項目 ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: 更新後的範例項目
 *               description:
 *                 type: string
 *                 example: 這是更新後的範例項目描述
 *     responses:
 *       200:
 *         description: 成功更新範例項目
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: ex_123456
 *                     name:
 *                       type: string
 *                       example: 更新後的範例項目
 *                     description:
 *                       type: string
 *                       example: 這是更新後的範例項目描述
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *                       example: 2024-01-21T15:45:00.000Z
 *       404:
 *         description: 範例項目不存在
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: 伺服器錯誤
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put('/:id', (req, res) => {
  const { id } = req.params
  const { name, description } = req.body

  if (id === 'ex_123456') {
    res.json({
      success: true,
      data: {
        id,
        name: name || '範例項目 1',
        description: description || '這是更新後的範例項目描述',
        updatedAt: new Date().toISOString(),
      },
    })
  } else {
    res.status(404).json({
      success: false,
      error: 'NotFound',
      message: '找不到指定的範例項目',
    })
  }
})

/**
 * @swagger
 * /api/examples/{id}:
 *   delete:
 *     summary: 刪除範例
 *     description: 刪除指定的範例項目
 *     tags: [Examples]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 範例項目 ID
 *     responses:
 *       200:
 *         description: 成功刪除範例項目
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: 範例項目已成功刪除
 *       404:
 *         description: 範例項目不存在
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: 伺服器錯誤
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete('/:id', (req, res) => {
  const { id } = req.params

  if (id === 'ex_123456') {
    res.json({
      success: true,
      message: '範例項目已成功刪除',
    })
  } else {
    res.status(404).json({
      success: false,
      error: 'NotFound',
      message: '找不到指定的範例項目',
    })
  }
})

export default router
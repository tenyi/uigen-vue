# Swagger API 文件指南

本指南說明如何在 UIGen Vue 專案中使用 Swagger 生成 API 文件。

## 概述

UIGen Vue 使用 [swagger-jsdoc](https://github.com/Surnet/swagger-jsdoc) 和 [swagger-ui-express](https://github.com/scottie1984/swagger-ui-express) 來生成和展示 API 文件。文件基於 [OpenAPI 3.0](https://swagger.io/specification/) 規格。

## 文件訪問

API 文件可以通過以下 URL 訪問：

- **Swagger UI**: `/api/docs`
- **OpenAPI JSON**: `/api/docs.json`
- **OpenAPI YAML**: `/api/docs.yaml`

## 如何為 API 端點添加文件

### 方法 1: 使用 JSDoc 註解

在路由檔案中使用 JSDoc 註解來描述 API 端點：

```typescript
/**
 * @swagger
 * /api/projects:
 *   get:
 *     summary: 獲取專案列表
 *     description: 返回所有可用的專案
 *     tags: [Projects]
 *     responses:
 *       200:
 *         description: 成功獲取專案列表
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Project'
 */
router.get('/', async (req, res) => {
  // 處理邏輯
});
```

### 方法 2: 使用輔助函數

專案提供了一些輔助函數來簡化 API 文件的生成：

```typescript
import { swaggerTag, swaggerPath } from '../lib/swagger-utils';

// 定義路由群組標籤
swaggerTag('Projects', '專案管理 API');

// 定義路由
swaggerPath(
  '/api/projects',
  'get',
  '獲取專案列表',
  '返回所有可用的專案',
  ['Projects'],
  [], // 參數
  null, // 請求體
  {
    '200': {
      description: '成功獲取專案列表',
      schema: {
        type: 'array',
        items: {
          $ref: '#/components/schemas/Project'
        }
      }
    }
  }
);
router.get('/', async (req, res) => {
  // 處理邏輯
});
```

## 文件結構

### 標籤

使用標籤來組織 API 端點：

```typescript
/**
 * @swagger
 * tags:
 *   name: Projects
 *   description: 專案管理 API
 */
```

### 參數

描述 API 端點的參數：

```typescript
/**
 * @swagger
 * /api/projects/{id}:
 *   get:
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 專案 ID
 */
```

### 請求體

描述 API 端點的請求體：

```typescript
/**
 * @swagger
 * /api/projects:
 *   post:
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
 *               description:
 *                 type: string
 */
```

### 回應

描述 API 端點的回應：

```typescript
/**
 * @swagger
 * /api/projects:
 *   get:
 *     responses:
 *       200:
 *         description: 成功獲取專案列表
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Project'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
```

## 組件定義

組件定義位於 `server/lib/swagger.ts` 檔案中，包括：

- **schemas**: 資料模型定義
- **responses**: 通用回應定義
- **securitySchemes**: 安全性定義

## 最佳實踐

1. **保持文件與程式碼同步**：當修改 API 端點時，同時更新文件
2. **使用引用**：使用 `$ref` 引用共用組件，避免重複定義
3. **提供詳細描述**：為每個端點、參數和回應提供清晰的描述
4. **使用標籤組織**：使用標籤將相關端點分組
5. **包含錯誤回應**：描述可能的錯誤情況和回應格式
6. **提供範例**：使用 `example` 屬性提供請求和回應的範例

## 範例

完整的範例可以參考 `server/routes/swagger-example.ts` 檔案。

## 參考資料

- [OpenAPI 3.0 規格](https://swagger.io/specification/)
- [swagger-jsdoc 文件](https://github.com/Surnet/swagger-jsdoc)
- [swagger-ui-express 文件](https://github.com/scottie1984/swagger-ui-express)
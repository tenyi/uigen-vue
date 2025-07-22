/**
 * Swagger API 文件配置
 * 自動生成 OpenAPI 3.0 規格文件
 */

import swaggerJSDoc from 'swagger-jsdoc'
import type { Request, Response } from 'express'
import swaggerUi from 'swagger-ui-express'

/**
 * Swagger 配置選項
 */
const swaggerOptions: swaggerJSDoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'UIGen Vue API',
      version: '1.0.0',
      description: 'AI 驅動的 Vue 組件生成器 API 文件',
      contact: {
        name: 'UIGen Vue Team',
        email: 'support@uigen-vue.com',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: process.env.API_BASE_URL || 'http://localhost:3001',
        description: '開發環境伺服器',
      },
      {
        url: 'https://api.uigen-vue.com',
        description: '生產環境伺服器',
      },
    ],
    components: {
      schemas: {
        Project: {
          type: 'object',
          required: ['id', 'name', 'createdAt', 'updatedAt'],
          properties: {
            id: {
              type: 'string',
              description: '專案唯一識別碼',
              example: 'clx1234567890abcdef',
            },
            name: {
              type: 'string',
              description: '專案名稱',
              example: '我的 Vue 組件庫',
            },
            description: {
              type: 'string',
              nullable: true,
              description: '專案描述',
              example: '一個包含多個可重用 Vue 組件的專案',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: '建立時間',
              example: '2024-01-21T10:30:00.000Z',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: '最後更新時間',
              example: '2024-01-21T15:45:00.000Z',
            },
            files: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/File',
              },
              description: '專案包含的檔案列表',
            },
          },
        },
        File: {
          type: 'object',
          required: ['id', 'name', 'content', 'projectId', 'createdAt', 'updatedAt'],
          properties: {
            id: {
              type: 'string',
              description: '檔案唯一識別碼',
              example: 'clx0987654321fedcba',
            },
            name: {
              type: 'string',
              description: '檔案名稱',
              example: 'Button.vue',
            },
            content: {
              type: 'string',
              description: '檔案內容',
              example: '<template>\n  <button class="btn">{{ label }}</button>\n</template>',
            },
            projectId: {
              type: 'string',
              description: '所屬專案 ID',
              example: 'clx1234567890abcdef',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: '建立時間',
              example: '2024-01-21T10:30:00.000Z',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: '最後更新時間',
              example: '2024-01-21T15:45:00.000Z',
            },
          },
        },
        User: {
          type: 'object',
          required: ['id', 'email', 'createdAt', 'updatedAt'],
          properties: {
            id: {
              type: 'string',
              description: '使用者唯一識別碼',
              example: 'clx5555555555555555',
            },
            email: {
              type: 'string',
              format: 'email',
              description: '使用者電子郵件',
              example: 'user@example.com',
            },
            name: {
              type: 'string',
              nullable: true,
              description: '使用者姓名',
              example: '張三',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: '註冊時間',
              example: '2024-01-21T10:30:00.000Z',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: '最後更新時間',
              example: '2024-01-21T15:45:00.000Z',
            },
          },
        },
        AIRequest: {
          type: 'object',
          required: ['message'],
          properties: {
            message: {
              type: 'string',
              description: '使用者訊息',
              example: '請幫我建立一個按鈕組件',
            },
            provider: {
              type: 'string',
              enum: ['anthropic', 'openai', 'gemini', 'mock'],
              description: 'AI 提供者',
              example: 'anthropic',
            },
            projectId: {
              type: 'string',
              description: '專案 ID（可選）',
              example: 'clx1234567890abcdef',
            },
          },
        },
        AIResponse: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: '回應 ID',
              example: 'resp_1234567890',
            },
            message: {
              type: 'string',
              description: 'AI 回應訊息',
              example: '我已經為您建立了一個按鈕組件...',
            },
            provider: {
              type: 'string',
              description: '使用的 AI 提供者',
              example: 'anthropic',
            },
            usage: {
              type: 'object',
              properties: {
                inputTokens: {
                  type: 'number',
                  description: '輸入 token 數量',
                  example: 150,
                },
                outputTokens: {
                  type: 'number',
                  description: '輸出 token 數量',
                  example: 300,
                },
                totalCost: {
                  type: 'number',
                  description: '總成本（美元）',
                  example: 0.0045,
                },
              },
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: '建立時間',
              example: '2024-01-21T10:30:00.000Z',
            },
          },
        },
        Error: {
          type: 'object',
          required: ['error', 'message'],
          properties: {
            error: {
              type: 'string',
              description: '錯誤類型',
              example: 'ValidationError',
            },
            message: {
              type: 'string',
              description: '錯誤訊息',
              example: '請求參數不正確',
            },
            details: {
              type: 'object',
              description: '詳細錯誤資訊',
              additionalProperties: true,
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
              description: '錯誤發生時間',
              example: '2024-01-21T10:30:00.000Z',
            },
          },
        },
        HealthCheck: {
          type: 'object',
          required: ['status', 'timestamp'],
          properties: {
            status: {
              type: 'string',
              enum: ['healthy', 'unhealthy'],
              description: '服務狀態',
              example: 'healthy',
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
              description: '檢查時間',
              example: '2024-01-21T10:30:00.000Z',
            },
            version: {
              type: 'string',
              description: 'API 版本',
              example: '1.0.0',
            },
            environment: {
              type: 'string',
              description: '執行環境',
              example: 'development',
            },
            uptime: {
              type: 'number',
              description: '運行時間（秒）',
              example: 3600,
            },
          },
        },
      },
      responses: {
        BadRequest: {
          description: '請求參數錯誤',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
        Unauthorized: {
          description: '未授權存取',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
        NotFound: {
          description: '資源不存在',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
        InternalServerError: {
          description: '伺服器內部錯誤',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
      },
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT Bearer Token 認證',
        },
      },
    },
    security: [
      {
        BearerAuth: [],
      },
    ],
  },
  apis: [
    './server/routes/*.ts', // 掃描路由檔案中的 JSDoc 註解
    './server/index.ts',    // 掃描主伺服器檔案
  ],
}

/**
 * 生成 Swagger 規格
 */
const swaggerSpec = swaggerJSDoc(swaggerOptions)

/**
 * 設定 Swagger UI 中介軟體
 * @param app Express 應用實例
 */
export function setupSwagger(app: any): void {
  // Swagger UI 選項
  const swaggerUiOptions = {
    customCss: `
      .swagger-ui .topbar { display: none }
      .swagger-ui .info .title { color: #1f2937; }
      .swagger-ui .scheme-container { background: #f9fafb; padding: 15px; border-radius: 8px; }
    `,
    customSiteTitle: 'UIGen Vue API 文件',
    customfavIcon: '/favicon.ico',
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      filter: true,
      showExtensions: true,
      showCommonExtensions: true,
      docExpansion: 'list',
      defaultModelsExpandDepth: 2,
      defaultModelExpandDepth: 2,
    },
  }


  // 修正：先用 .get 註冊 serve，再用 setup 處理 UI，避免 301 redirect
  app.get('/api/docs', swaggerUi.serve, (req: Request, res: Response, next: any) => {
    // 測試環境補齊安全標頭
    res.setHeader('X-Content-Type-Options', 'nosniff')
    res.setHeader('X-Frame-Options', 'SAMEORIGIN')
    res.setHeader('X-XSS-Protection', '1; mode=block')
    return swaggerUi.setup(swaggerSpec, swaggerUiOptions)(req, res, next)
  })

  // 提供 JSON 格式的 API 規格
  app.get('/api/docs.json', (_req: Request, res: Response) => {
    res.setHeader('Content-Type', 'application/json')
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate')
    res.send(swaggerSpec)
  })

  // 提供 YAML 格式的 API 規格 (可選)
  app.get('/api/docs.yaml', (_req: Request, res: Response) => {
    const YAML = require('yaml')
    const yamlString = YAML.stringify(swaggerSpec)
    res.setHeader('Content-Type', 'text/yaml')
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate')
    res.send(yamlString)
  })

  console.log('📚 Swagger API documentation available at /api/docs')
  console.log('📄 OpenAPI JSON spec available at /api/docs.json')
  console.log('📄 OpenAPI YAML spec available at /api/docs.yaml')
}

/**
 * 匯出 Swagger 規格（用於測試）
 */
export { swaggerSpec }
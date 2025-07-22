/**
 * Swagger 工具函數
 * 提供輔助函數以簡化 API 文件的生成
 */

import type { Request, Response, NextFunction } from 'express'

/**
 * 生成 Swagger 路由文件的裝飾器函數
 * 用於在路由處理器上添加 JSDoc 註解
 * 
 * @param summary 路由摘要
 * @param description 路由詳細描述
 * @param tags 路由標籤
 * @param responses 回應定義
 * @returns 裝飾後的路由處理器
 */
export function swaggerRoute(
  summary: string,
  description: string,
  tags: string[],
  responses: Record<string, any> = {}
) {
  return function (
    _target: any,
    _propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value

    // 添加 Swagger JSDoc 註解
    originalMethod.apiDoc = {
      summary,
      description,
      tags,
      responses: {
        '200': {
          description: '成功回應',
          ...responses['200'],
        },
        '400': {
          description: '請求錯誤',
          ...responses['400'],
        },
        '500': {
          description: '伺服器錯誤',
          ...responses['500'],
        },
        ...responses,
      },
    }

    return descriptor
  }
}

/**
 * 生成 Swagger 參數文件的裝飾器函數
 * 
 * @param parameters 參數定義
 * @returns 裝飾後的路由處理器
 */
export function swaggerParams(parameters: any[]) {
  return function (
    _target: any,
    _propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value
    
    if (!originalMethod.apiDoc) {
      originalMethod.apiDoc = {}
    }
    
    originalMethod.apiDoc.parameters = parameters
    
    return descriptor
  }
}

/**
 * 生成 Swagger 請求體文件的裝飾器函數
 * 
 * @param schema 請求體結構定義
 * @returns 裝飾後的路由處理器
 */
export function swaggerRequestBody(schema: any) {
  return function (
    _target: any,
    _propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value
    
    if (!originalMethod.apiDoc) {
      originalMethod.apiDoc = {}
    }
    
    originalMethod.apiDoc.requestBody = {
      content: {
        'application/json': {
          schema,
        },
      },
      required: true,
    }
    
    return descriptor
  }
}

/**
 * 生成 Swagger 中介軟體
 * 用於將路由處理器中的 apiDoc 屬性轉換為 JSDoc 註解
 * 
 * @returns Express 中介軟體
 */
export function swaggerDocs() {
  return function (req: Request, _res: Response, next: NextFunction) {
    const handler = req.route?.stack[0]?.handle
    
    if (handler && handler.apiDoc) {
      // 將 apiDoc 屬性轉換為 JSDoc 註解
      // 這裡不需要實際執行任何操作，因為 swagger-jsdoc 會掃描 JSDoc 註解
    }
    
    next()
  }
}

/**
 * 生成 Swagger 路由群組
 * 用於在路由檔案頂部添加標籤定義
 * 
 * @param name 標籤名稱
 * @param description 標籤描述
 * @returns 標籤定義字串
 */
export function swaggerTag(name: string, description: string): string {
  return `
/**
 * @swagger
 * tags:
 *   name: ${name}
 *   description: ${description}
 */
`
}

/**
 * 生成 Swagger 路由定義
 * 用於在路由處理器前添加路由定義
 * 
 * @param path 路由路徑
 * @param method HTTP 方法
 * @param summary 路由摘要
 * @param description 路由詳細描述
 * @param tags 路由標籤
 * @param parameters 參數定義
 * @param requestBody 請求體定義
 * @param responses 回應定義
 * @returns 路由定義字串
 */
export function swaggerPath(
  path: string,
  method: 'get' | 'post' | 'put' | 'delete',
  summary: string,
  description: string,
  tags: string[],
  parameters: any[] = [],
  requestBody: any = null,
  responses: Record<string, any> = {}
): string {
  let paramString = ''
  if (parameters.length > 0) {
    paramString = `
 *   parameters:
${parameters.map(param => ` *     - ${JSON.stringify(param)}`).join('\n')}
`
  }

  let requestBodyString = ''
  if (requestBody) {
    requestBodyString = `
 *   requestBody:
 *     required: true
 *     content:
 *       application/json:
 *         schema:
 *           ${JSON.stringify(requestBody)}
`
  }

  let responsesString = ''
  if (Object.keys(responses).length > 0) {
    responsesString = `
 *   responses:
${Object.entries(responses).map(([code, resp]) => ` *     ${code}:
 *       description: ${resp.description}
 *       content:
 *         application/json:
 *           schema:
 *             ${JSON.stringify(resp.schema)}`).join('\n')}
`
  }

  return `
/**
 * @swagger
 * ${path}:
 *   ${method}:
 *     summary: ${summary}
 *     description: ${description}
 *     tags: [${tags.join(', ')}]${paramString}${requestBodyString}${responsesString}
 */
`
}
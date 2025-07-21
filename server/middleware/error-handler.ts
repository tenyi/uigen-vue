import type { Request, Response, NextFunction } from 'express'
import { HTTP_STATUS } from '@shared/constants/api'

/**
 * 自定義錯誤類別
 */
export class AppError extends Error {
  public statusCode: number
  public isOperational: boolean

  constructor(message: string, statusCode: number = HTTP_STATUS.INTERNAL_SERVER_ERROR) {
    super(message)
    this.statusCode = statusCode
    this.isOperational = true

    Error.captureStackTrace(this, this.constructor)
  }
}

/**
 * 驗證錯誤
 */
export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, HTTP_STATUS.BAD_REQUEST)
  }
}

/**
 * 認證錯誤
 */
export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, HTTP_STATUS.UNAUTHORIZED)
  }
}

/**
 * 授權錯誤
 */
export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, HTTP_STATUS.FORBIDDEN)
  }
}

/**
 * 資源未找到錯誤
 */
export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, HTTP_STATUS.NOT_FOUND)
  }
}

/**
 * 衝突錯誤
 */
export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, HTTP_STATUS.CONFLICT)
  }
}

/**
 * 速率限制錯誤
 */
export class RateLimitError extends AppError {
  constructor(message: string = 'Too many requests') {
    super(message, HTTP_STATUS.TOO_MANY_REQUESTS)
  }
}

/**
 * 全域錯誤處理中介軟體
 */
export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // 如果回應已經發送，交給預設的 Express 錯誤處理器
  if (res.headersSent) {
    return next(error)
  }

  // 預設錯誤狀態碼和訊息
  let statusCode: number = HTTP_STATUS.INTERNAL_SERVER_ERROR
  let message = 'Internal server error'
  let details: any = undefined

  // 處理自定義錯誤
  if (error instanceof AppError) {
    statusCode = error.statusCode
    message = error.message
  }
  // 處理 Mongoose 驗證錯誤
  else if (error.name === 'ValidationError') {
    statusCode = 400
    message = 'Validation error'
    details = Object.values((error as any).errors).map((err: any) => ({
      field: err.path,
      message: err.message,
    }))
  }
  // 處理 Mongoose 重複鍵錯誤
  else if (error.name === 'MongoError' && (error as any).code === 11000) {
    statusCode = 409
    message = 'Duplicate field value'
    const field = Object.keys((error as any).keyValue)[0]
    details = { field, value: (error as any).keyValue[field] }
  }
  // 處理 JWT 錯誤
  else if (error.name === 'JsonWebTokenError') {
    statusCode = 401
    message = 'Invalid token'
  }
  else if (error.name === 'TokenExpiredError') {
    statusCode = 401
    message = 'Token expired'
  }
  // 處理語法錯誤
  else if (error instanceof SyntaxError && 'body' in error) {
    statusCode = 400
    message = 'Invalid JSON format'
  }

  // 記錄錯誤
  if (statusCode >= HTTP_STATUS.INTERNAL_SERVER_ERROR) {
    console.error('🚨 Server Error:', {
      message: error.message,
      stack: error.stack,
      url: req.url,
      method: req.method,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      timestamp: new Date().toISOString(),
    })
  } else {
    console.warn('⚠️ Client Error:', {
      message: error.message,
      url: req.url,
      method: req.method,
      ip: req.ip,
      statusCode,
      timestamp: new Date().toISOString(),
    })
  }

  // 建構錯誤回應
  const errorResponse: any = {
    success: false,
    message,
    error: {
      type: error.constructor.name,
      statusCode,
    },
    timestamp: new Date().toISOString(),
    path: req.path,
    method: req.method,
  }

  // 在開發環境中包含錯誤堆疊
  if (process.env.NODE_ENV === 'development') {
    errorResponse.error.stack = error.stack
    errorResponse.error.details = details
  }

  // 在生產環境中隱藏內部錯誤詳情
  if (process.env.NODE_ENV === 'production' && statusCode >= HTTP_STATUS.INTERNAL_SERVER_ERROR) {
    errorResponse.message = 'Something went wrong'
    delete errorResponse.error.stack
  }

  // 添加詳細資訊（如果有）
  if (details && process.env.NODE_ENV !== 'production') {
    errorResponse.details = details
  }

  // 發送錯誤回應
  res.status(statusCode).json(errorResponse)
}

/**
 * 非同步錯誤包裝器
 * 用於包裝非同步路由處理器，自動捕獲錯誤
 */
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}

/**
 * 404 錯誤處理器
 */
export const notFoundHandler = (req: Request, _res: Response, next: NextFunction): void => {
  const error = new NotFoundError(`Route ${req.originalUrl} not found`)
  next(error)
}
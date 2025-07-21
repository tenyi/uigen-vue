import type { Request, Response } from 'express'
import { HTTP_STATUS } from '@shared/constants/api'

/**
 * 404 Not Found 中介軟體
 * 處理找不到的路由
 */
export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(HTTP_STATUS.NOT_FOUND).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`,
    error: {
      type: 'NotFoundError',
      statusCode: HTTP_STATUS.NOT_FOUND,
    },
    timestamp: new Date().toISOString(),
    path: req.path,
    method: req.method,
    availableEndpoints: {
      api: '/api/v1',
      health: '/health',
      websocket: '/ws',
    },
  })
}
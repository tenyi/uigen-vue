import { Router } from 'express'
import { authRouter } from './auth'
import projectsRouter from './projects';
import filesRouter from './files';
import { aiRouter } from './ai'
import { usersRouter } from './users'

/**
 * 主要 API 路由器
 * 整合所有子路由模組
 */
const apiRouter = Router()

// API 版本資訊
apiRouter.get('/', (_req, res) => {
  res.json({
    name: 'UIGen Vue API',
    version: 'v1',
    description: 'AI-powered Vue component generator API',
    endpoints: {
      auth: '/api/auth',
      projects: '/api/projects',
      files: '/api/files',
      ai: '/api/ai',
      users: '/api/users',
    },
    documentation: '/api/docs',
    health: '/health',
    websocket: '/ws',
  })
})

// 直接掛載路由，不使用版本前綴
apiRouter.use('/auth', authRouter)
apiRouter.use('/projects', projectsRouter)
apiRouter.use('/files', filesRouter)
apiRouter.use('/ai', aiRouter)
apiRouter.use('/users', usersRouter)

export { apiRouter }
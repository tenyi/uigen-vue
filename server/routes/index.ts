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
      auth: '/api/v1/auth',
      projects: '/api/v1/projects',
      files: '/api/v1/files',
      ai: '/api/v1/ai',
      users: '/api/v1/users',
    },
    documentation: '/api/v1/docs',
    health: '/health',
    websocket: '/ws',
  })
})

// 版本化路由
const v1Router = Router()

// 註冊各個功能模組的路由
v1Router.use('/auth', authRouter)
v1Router.use('/projects', projectsRouter)
v1Router.use('/files', filesRouter)
v1Router.use('/ai', aiRouter)
v1Router.use('/users', usersRouter)

// 將 v1 路由掛載到主路由
apiRouter.use('/v1', v1Router)

export { apiRouter }
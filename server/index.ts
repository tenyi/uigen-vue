import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import dotenv from 'dotenv'
import { createServer } from 'http'
import { WebSocketServer } from 'ws'

// 載入環境變數
dotenv.config()

// 導入路由
import { apiRouter } from './routes'
import { errorHandler } from './middleware/error-handler'
import { notFoundHandler } from './middleware/not-found'

/**
 * UIGen Vue 後端伺服器
 * 提供 RESTful API 和 WebSocket 支援
 */
class Server {
  private app: express.Application
  private server: any
  private wss: WebSocketServer | null = null
  private port: number

  constructor() {
    this.app = express()
    this.port = parseInt(process.env.PORT || '3001', 10)
    
    this.setupMiddleware()
    this.setupRoutes()
    this.setupErrorHandling()
  }

  /**
   * 設定中介軟體
   */
  private setupMiddleware(): void {
    // 安全性中介軟體
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
    }))

    // CORS 設定
    this.app.use(cors({
      origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Version', 'X-Request-ID'],
    }))

    // 日誌中介軟體
    if (process.env.NODE_ENV !== 'test') {
      this.app.use(morgan('combined'))
    }

    // 解析 JSON 和 URL 編碼的請求體
    this.app.use(express.json({ limit: process.env.MAX_FILE_SIZE || '10mb' }))
    this.app.use(express.urlencoded({ extended: true, limit: process.env.MAX_FILE_SIZE || '10mb' }))

    // 健康檢查端點
    this.app.get('/health', (_req, res) => {
      res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
      })
    })
  }

  /**
   * 設定路由
   */
  private setupRoutes(): void {
    // API 路由
    this.app.use('/api', apiRouter)

    // 404 處理
    this.app.use(notFoundHandler)
  }

  /**
   * 設定錯誤處理
   */
  private setupErrorHandling(): void {
    this.app.use(errorHandler)
  }

  /**
   * 設定 WebSocket 伺服器
   */
  private setupWebSocket(): void {
    this.wss = new WebSocketServer({ 
      server: this.server,
      path: '/ws'
    })

    this.wss.on('connection', (ws, request) => {
      console.log(`🔌 WebSocket connection established from ${request.socket.remoteAddress}`)
      
      ws.on('message', (message) => {
        try {
          const data = JSON.parse(message.toString())
          console.log('📨 WebSocket message received:', data.type)
          
          // 處理不同類型的 WebSocket 訊息
          this.handleWebSocketMessage(ws, data)
        } catch (error) {
          console.error('❌ WebSocket message parsing error:', error)
          ws.send(JSON.stringify({
            type: 'error',
            message: 'Invalid message format'
          }))
        }
      })

      ws.on('close', () => {
        console.log('🔌 WebSocket connection closed')
      })

      ws.on('error', (error) => {
        console.error('❌ WebSocket error:', error)
      })

      // 發送歡迎訊息
      ws.send(JSON.stringify({
        type: 'welcome',
        message: 'Connected to UIGen Vue WebSocket server'
      }))
    })

    console.log('🔌 WebSocket server initialized on /ws')
  }

  /**
   * 處理 WebSocket 訊息
   */
  private handleWebSocketMessage(ws: any, data: any): void {
    switch (data.type) {
      case 'ping':
        ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }))
        break
      
      case 'chat':
        // 聊天訊息處理將在後續實現
        ws.send(JSON.stringify({
          type: 'chat_response',
          message: 'Chat functionality will be implemented soon'
        }))
        break
      
      case 'preview':
        // 預覽功能將在後續實現
        ws.send(JSON.stringify({
          type: 'preview_response',
          message: 'Preview functionality will be implemented soon'
        }))
        break
      
      default:
        ws.send(JSON.stringify({
          type: 'error',
          message: `Unknown message type: ${data.type}`
        }))
    }
  }

  /**
   * 啟動伺服器
   */
  public async start(): Promise<void> {
    try {
      // 創建 HTTP 伺服器
      this.server = createServer(this.app)
      
      // 設定 WebSocket
      this.setupWebSocket()

      // 啟動伺服器
      this.server.listen(this.port, () => {
        console.log(`🚀 UIGen Vue Server is running on port ${this.port}`)
        console.log(`📡 API endpoint: http://localhost:${this.port}/api`)
        console.log(`🔌 WebSocket endpoint: ws://localhost:${this.port}/ws`)
        console.log(`🏥 Health check: http://localhost:${this.port}/health`)
        console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`)
      })

      // 優雅關閉處理
      this.setupGracefulShutdown()

    } catch (error) {
      console.error('❌ Failed to start server:', error)
      process.exit(1)
    }
  }

  /**
   * 設定優雅關閉
   */
  private setupGracefulShutdown(): void {
    const shutdown = (signal: string) => {
      console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`)
      
      if (this.server) {
        this.server.close(() => {
          console.log('✅ HTTP server closed')
          
          if (this.wss) {
            this.wss.close(() => {
              console.log('✅ WebSocket server closed')
              process.exit(0)
            })
          } else {
            process.exit(0)
          }
        })
      }
    }

    process.on('SIGTERM', () => shutdown('SIGTERM'))
    process.on('SIGINT', () => shutdown('SIGINT'))
  }

  /**
   * 獲取 Express 應用實例（用於測試）
   */
  public getApp(): express.Application {
    return this.app
  }
}

// 如果直接執行此檔案，啟動伺服器
if (require.main === module) {
  const server = new Server()
  server.start().catch(console.error)
}

export { Server }
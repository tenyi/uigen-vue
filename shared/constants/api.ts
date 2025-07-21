// API 版本控制常數
export const API_VERSION = {
  V1: 'v1',
  CURRENT: 'v1',
} as const

export const API_ENDPOINTS = {
  // 認證相關
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    PROFILE: '/auth/profile',
  },
  
  // 專案管理
  PROJECTS: {
    LIST: '/projects',
    CREATE: '/projects',
    GET: '/projects/:id',
    UPDATE: '/projects/:id',
    DELETE: '/projects/:id',
  },
  
  // 檔案管理
  FILES: {
    LIST: '/projects/:projectId/files',
    CREATE: '/projects/:projectId/files',
    GET: '/projects/:projectId/files/:fileId',
    UPDATE: '/projects/:projectId/files/:fileId',
    DELETE: '/projects/:projectId/files/:fileId',
  },
  
  // AI 整合
  AI: {
    CHAT: '/ai/chat',
    PROVIDERS: '/ai/providers',
    HEALTH: '/ai/health',
    USAGE: '/ai/usage',
  },
  
  // WebSocket
  WS: {
    CHAT: '/ws/chat',
    PREVIEW: '/ws/preview',
  },
} as const

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const

export const API_HEADERS = {
  CONTENT_TYPE: 'Content-Type',
  AUTHORIZATION: 'Authorization',
  API_VERSION: 'X-API-Version',
  REQUEST_ID: 'X-Request-ID',
  RATE_LIMIT_REMAINING: 'X-RateLimit-Remaining',
  RATE_LIMIT_RESET: 'X-RateLimit-Reset',
} as const
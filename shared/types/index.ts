// 共享型別定義
export interface User {
  id: string
  email: string
  displayName: string
  createdAt: Date
  updatedAt: Date
}

export interface Project {
  id: string
  name: string
  description?: string
  userId: string
  files: ProjectFile[]
  createdAt: Date
  updatedAt: Date
}

export interface ProjectFile {
  id: string
  name: string
  path: string
  content: string
  type: FileType
  projectId: string
  createdAt: Date
  updatedAt: Date
}

export enum FileType {
  VUE = 'vue',
  TYPESCRIPT = 'ts',
  JAVASCRIPT = 'js',
  CSS = 'css',
  HTML = 'html',
  JSON = 'json',
  MARKDOWN = 'md',
}

export interface AIProvider {
  id: string
  name: string
  apiKey: string
  baseUrl: string
  model: string
  isActive: boolean
}

export interface ChatMessage {
  id: string
  content: string
  role: 'user' | 'assistant' | 'system'
  timestamp: Date
  projectId?: string
}

export interface APIResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

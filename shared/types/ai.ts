// AI 提供者相關型別定義

export interface AIMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp?: Date
}

export interface AIResponse {
  content: string
  usage?: {
    inputTokens: number
    outputTokens: number
    totalTokens: number
  }
  model?: string
  finishReason?: string
}

export interface AIStreamChunk {
  content: string
  isComplete: boolean
  usage?: {
    inputTokens: number
    outputTokens: number
    totalTokens: number
  }
}

export interface AIProviderConfig {
  id: string
  name: string
  apiKey: string
  baseUrl?: string
  model: string
  isActive: boolean
  priority: number
  maxTokens?: number
  temperature?: number
  topP?: number
  topK?: number
  rateLimitPerMinute?: number
  rateLimitPerHour?: number
  costPerInputToken?: number
  costPerOutputToken?: number
}

export interface AIProviderStatus {
  id: string
  isHealthy: boolean
  lastChecked: Date
  responseTime?: number
  errorMessage?: string
  usage: {
    requestsToday: number
    tokensToday: number
    costToday: number
    requestsThisMonth: number
    tokensThisMonth: number
    costThisMonth: number
  }
}

export interface AIGenerateOptions {
  maxTokens?: number
  temperature?: number
  topP?: number
  topK?: number
  stream?: boolean
  systemPrompt?: string
}

export const AI_PROVIDERS = {
  ANTHROPIC: 'anthropic',
  OPENAI: 'openai',
  GOOGLE: 'google',
  MOCK: 'mock'
} as const

export type AIProviderType = typeof AI_PROVIDERS[keyof typeof AI_PROVIDERS]

export const AI_MODELS = {
  // Anthropic Claude 模型
  CLAUDE_3_5_SONNET: 'claude-3-5-sonnet-20241022',
  CLAUDE_3_5_HAIKU: 'claude-3-5-haiku-20241022',
  CLAUDE_3_OPUS: 'claude-3-opus-20240229',
  
  // OpenAI GPT 模型
  GPT_4O: 'gpt-4o',
  GPT_4O_MINI: 'gpt-4o-mini',
  GPT_4_TURBO: 'gpt-4-turbo',
  
  // Google Gemini 模型
  GEMINI_2_0_FLASH: 'gemini-2.0-flash-001',
  GEMINI_1_5_PRO: 'gemini-1.5-pro',
  GEMINI_1_5_FLASH: 'gemini-1.5-flash'
} as const

export type AIModel = typeof AI_MODELS[keyof typeof AI_MODELS]
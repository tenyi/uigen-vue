import type { AIMessage, AIResponse, AIStreamChunk, AIProviderConfig, AIGenerateOptions } from '@shared/types/ai'

/**
 * AI 提供者抽象基類
 * 所有 AI 提供者都必須實現此介面
 */
export abstract class BaseAIProvider {
  protected config: AIProviderConfig
  protected isInitialized = false

  constructor(config: AIProviderConfig) {
    this.config = config
  }

  /**
   * 初始化提供者
   */
  abstract initialize(): Promise<void>

  /**
   * 生成內容
   * @param messages 對話訊息
   * @param options 生成選項
   */
  abstract generateContent(
    messages: AIMessage[],
    options?: AIGenerateOptions
  ): Promise<AIResponse>

  /**
   * 串流生成內容
   * @param messages 對話訊息
   * @param options 生成選項
   */
  abstract generateContentStream(
    messages: AIMessage[],
    options?: AIGenerateOptions
  ): AsyncGenerator<AIStreamChunk, void, unknown>

  /**
   * 健康檢查
   */
  abstract healthCheck(): Promise<boolean>

  /**
   * 獲取提供者資訊
   */
  getInfo(): AIProviderConfig {
    return { ...this.config }
  }

  /**
   * 更新配置
   * @param config 新配置
   */
  updateConfig(config: Partial<AIProviderConfig>): void {
    this.config = { ...this.config, ...config }
  }

  /**
   * 檢查是否已初始化
   */
  protected ensureInitialized(): void {
    if (!this.isInitialized) {
      throw new Error(`AI Provider ${this.config.name} is not initialized`)
    }
  }

  /**
   * 驗證 API 金鑰
   */
  protected validateApiKey(): void {
    if (!this.config.apiKey) {
      throw new Error(`API key is required for ${this.config.name}`)
    }
  }

  /**
   * 格式化錯誤訊息
   * @param error 錯誤對象
   */
  protected formatError(error: any): string {
    if (error.response?.data?.message) {
      return error.response.data.message
    }
    
    if (error.message) {
      return error.message
    }
    
    return `Unknown error occurred in ${this.config.name}`
  }

  /**
   * 計算使用量成本
   * @param inputTokens 輸入 token 數量
   * @param outputTokens 輸出 token 數量
   */
  protected calculateCost(inputTokens: number, outputTokens: number): number {
    const inputCost = (this.config.costPerInputToken || 0) * inputTokens
    const outputCost = (this.config.costPerOutputToken || 0) * outputTokens
    return inputCost + outputCost
  }

  /**
   * 驗證速率限制
   * @param requestCount 當前請求數量
   * @param timeWindow 時間窗口 ('minute' | 'hour')
   */
  protected checkRateLimit(requestCount: number, timeWindow: 'minute' | 'hour'): boolean {
    const limit = timeWindow === 'minute' 
      ? this.config.rateLimitPerMinute 
      : this.config.rateLimitPerHour

    if (limit && requestCount >= limit) {
      throw new Error(`Rate limit exceeded for ${this.config.name}: ${requestCount}/${limit} requests per ${timeWindow}`)
    }

    return true
  }
}
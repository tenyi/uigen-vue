import type { AIMessage, AIResponse, AIStreamChunk, AIProviderConfig, AIGenerateOptions, AIToolCall, AIToolResult } from '@shared/types/ai'
import { ToolManager } from './tools/tool-manager'
import { VirtualFileSystem } from '../../../src/lib/file-system'

/**
 * AI 提供者抽象基類
 * 所有 AI 提供者都必須實現此介面
 */
export abstract class BaseAIProvider {
  protected config: AIProviderConfig
  protected isInitialized = false
  protected toolManager: ToolManager | null = null

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
   * 設定工具管理器
   * @param fileSystem 虛擬檔案系統實例
   */
  setToolManager(fileSystem: VirtualFileSystem): void {
    this.toolManager = new ToolManager(fileSystem)
  }

  /**
   * 獲取可用工具列表
   */
  getAvailableTools() {
    return this.toolManager?.getAvailableTools() || []
  }

  /**
   * 執行工具呼叫
   * @param toolCalls 工具呼叫陣列
   */
  async executeTools(toolCalls: AIToolCall[]): Promise<AIToolResult[]> {
    if (!this.toolManager) {
      throw new Error('Tool manager not initialized')
    }
    
    return await this.toolManager.executeTools(toolCalls)
  }

  /**
   * 處理包含工具呼叫的回應
   * @param response AI 回應
   */
  async processToolCalls(response: AIResponse): Promise<AIResponse> {
    if (!response.toolCalls || response.toolCalls.length === 0) {
      return response
    }

    try {
      const toolResults = await this.executeTools(response.toolCalls)
      
      // 將工具結果添加到回應中
      return {
        ...response,
        content: response.content + '\n\n' + this.formatToolResults(toolResults)
      }
    } catch (error) {
      console.error('Error processing tool calls:', error)
      const errorMessage = error instanceof Error ? error.message : String(error)
      return {
        ...response,
        content: response.content + '\n\n工具執行時發生錯誤: ' + errorMessage
      }
    }
  }

  /**
   * 格式化工具執行結果
   * @param results 工具執行結果陣列
   */
  private formatToolResults(results: AIToolResult[]): string {
    return results.map(result => {
      if (result.error) {
        return `工具執行錯誤 (${result.toolCallId}): ${result.error}`
      }
      
      const resultStr = typeof result.result === 'object' 
        ? JSON.stringify(result.result, null, 2)
        : String(result.result)
      
      return `工具執行結果 (${result.toolCallId}):\n${resultStr}`
    }).join('\n\n')
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
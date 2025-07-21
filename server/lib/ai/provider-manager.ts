import { BaseAIProvider } from './base-provider'
import { MockProvider } from './mock-provider'
import { AnthropicProvider } from './anthropic-provider'
import { OpenAIProvider } from './openai-provider'
import { GoogleProvider } from './google-provider'
import type { AIProviderConfig, AIProviderStatus, AIMessage, AIResponse, AIStreamChunk, AIGenerateOptions } from '@shared/types/ai'
import { AI_PROVIDERS } from '@shared/types/ai'

/**
 * AI 提供者管理器
 * 負責管理多個 AI 提供者，實現自動容錯和負載均衡
 */
export class AIProviderManager {
  private providers: Map<string, BaseAIProvider> = new Map()
  private providerStatus: Map<string, AIProviderStatus> = new Map()
  private defaultProvider: string | null = null

  constructor() {
    console.log('🤖 AI Provider Manager initialized')
  }

  /**
   * 註冊 AI 提供者
   * @param config 提供者配置
   */
  async registerProvider(config: AIProviderConfig): Promise<void> {
    try {
      let provider: BaseAIProvider

      // 根據提供者類型創建實例
      switch (config.id) {
        case AI_PROVIDERS.ANTHROPIC:
          provider = new AnthropicProvider(config)
          break
        case AI_PROVIDERS.OPENAI:
          provider = new OpenAIProvider(config)
          break
        case AI_PROVIDERS.GOOGLE:
          provider = new GoogleProvider(config)
          break
        case AI_PROVIDERS.MOCK:
          provider = new MockProvider(config)
          break
        default:
          throw new Error(`Unknown provider type: ${config.id}`)
      }

      // 初始化提供者
      await provider.initialize()

      // 註冊到管理器
      this.providers.set(config.id, provider)

      // 初始化狀態
      this.providerStatus.set(config.id, {
        id: config.id,
        isHealthy: true,
        lastChecked: new Date(),
        usage: {
          requestsToday: 0,
          tokensToday: 0,
          costToday: 0,
          requestsThisMonth: 0,
          tokensThisMonth: 0,
          costThisMonth: 0,
        },
      })

      // 設定第一個活躍的提供者為預設
      if (config.isActive && !this.defaultProvider) {
        this.defaultProvider = config.id
      }

      console.log(`✅ Provider ${config.name} registered successfully`)
    } catch (error) {
      console.error(`❌ Failed to register provider ${config.name}:`, error)
      throw error
    }
  }

  /**
   * 生成內容
   * @param messages 對話訊息
   * @param options 生成選項
   * @param preferredProvider 偏好的提供者 ID
   */
  async generateContent(
    messages: AIMessage[],
    options?: AIGenerateOptions,
    preferredProvider?: string
  ): Promise<AIResponse> {
    const provider = await this.getAvailableProvider(preferredProvider)
    
    try {
      const response = await provider.generateContent(messages, options)
      
      // 更新使用量統計
      this.updateUsageStats(provider.getInfo().id, response.usage)
      
      return response
    } catch (error) {
      console.error(`❌ Provider ${provider.getInfo().name} failed:`, error)
      
      // 標記提供者為不健康
      this.markProviderUnhealthy(provider.getInfo().id, error instanceof Error ? error.message : String(error))
      
      // 嘗試使用備用提供者
      if (preferredProvider) {
        console.log('🔄 Trying fallback provider...')
        return this.generateContent(messages, options) // 不指定偏好提供者
      }
      
      throw error
    }
  }

  /**
   * 串流生成內容
   * @param messages 對話訊息
   * @param options 生成選項
   * @param preferredProvider 偏好的提供者 ID
   */
  async* generateContentStream(
    messages: AIMessage[],
    options?: AIGenerateOptions,
    preferredProvider?: string
  ): AsyncGenerator<AIStreamChunk, void, unknown> {
    const provider = await this.getAvailableProvider(preferredProvider)
    
    try {
      let finalUsage: any = null
      
      for await (const chunk of provider.generateContentStream(messages, options)) {
        if (chunk.isComplete && chunk.usage) {
          finalUsage = chunk.usage
        }
        yield chunk
      }
      
      // 更新使用量統計
      if (finalUsage) {
        this.updateUsageStats(provider.getInfo().id, finalUsage)
      }
    } catch (error) {
      console.error(`❌ Provider ${provider.getInfo().name} stream failed:`, error)
      
      // 標記提供者為不健康
      this.markProviderUnhealthy(provider.getInfo().id, error instanceof Error ? error.message : String(error))
      
      throw error
    }
  }

  /**
   * 獲取可用的提供者
   * @param preferredProvider 偏好的提供者 ID
   */
  private async getAvailableProvider(preferredProvider?: string): Promise<BaseAIProvider> {
    // 如果指定了偏好提供者且可用，使用它
    if (preferredProvider && this.providers.has(preferredProvider)) {
      const provider = this.providers.get(preferredProvider)!
      const status = this.providerStatus.get(preferredProvider)!
      
      if (status.isHealthy) {
        return provider
      }
    }

    // 按優先級排序獲取健康的提供者
    const healthyProviders = Array.from(this.providers.entries())
      .filter(([id]) => {
        const status = this.providerStatus.get(id)
        return status?.isHealthy
      })
      .map(([, provider]) => provider)
      .sort((a, b) => (b.getInfo().priority || 0) - (a.getInfo().priority || 0))

    if (healthyProviders.length === 0) {
      throw new Error('No healthy AI providers available')
    }

    return healthyProviders[0]
  }

  /**
   * 更新使用量統計
   * @param providerId 提供者 ID
   * @param usage 使用量資訊
   */
  private updateUsageStats(providerId: string, usage?: { inputTokens: number; outputTokens: number; totalTokens: number }): void {
    if (!usage) return

    const status = this.providerStatus.get(providerId)
    if (!status) return

    const provider = this.providers.get(providerId)
    if (!provider) return

    const config = provider.getInfo()
    const cost = (usage.inputTokens * (config.costPerInputToken || 0)) + 
                 (usage.outputTokens * (config.costPerOutputToken || 0))

    status.usage.requestsToday += 1
    status.usage.tokensToday += usage.totalTokens
    status.usage.costToday += cost
    status.usage.requestsThisMonth += 1
    status.usage.tokensThisMonth += usage.totalTokens
    status.usage.costThisMonth += cost
  }

  /**
   * 標記提供者為不健康
   * @param providerId 提供者 ID
   * @param errorMessage 錯誤訊息
   */
  private markProviderUnhealthy(providerId: string, errorMessage: string): void {
    const status = this.providerStatus.get(providerId)
    if (status) {
      status.isHealthy = false
      status.errorMessage = errorMessage
      status.lastChecked = new Date()
    }
  }

  /**
   * 執行健康檢查
   */
  async performHealthChecks(): Promise<void> {
    console.log('🔍 Performing health checks for all providers...')
    
    const promises = Array.from(this.providers.entries()).map(async ([id, provider]) => {
      try {
        const startTime = Date.now()
        const isHealthy = await provider.healthCheck()
        const responseTime = Date.now() - startTime

        const status = this.providerStatus.get(id)
        if (status) {
          status.isHealthy = isHealthy
          status.responseTime = responseTime
          status.lastChecked = new Date()
          status.errorMessage = isHealthy ? undefined : 'Health check failed'
        }

        console.log(`${isHealthy ? '✅' : '❌'} ${provider.getInfo().name}: ${responseTime}ms`)
      } catch (error) {
        console.error(`❌ Health check failed for ${provider.getInfo().name}:`, error)
        this.markProviderUnhealthy(id, error instanceof Error ? error.message : String(error))
      }
    })

    await Promise.all(promises)
  }

  /**
   * 獲取所有提供者狀態
   */
  getProviderStatuses(): AIProviderStatus[] {
    return Array.from(this.providerStatus.values())
  }

  /**
   * 獲取提供者資訊
   */
  getProviderInfo(providerId: string): AIProviderConfig | null {
    const provider = this.providers.get(providerId)
    return provider ? provider.getInfo() : null
  }

  /**
   * 獲取所有提供者資訊
   */
  getAllProviderInfo(): AIProviderConfig[] {
    return Array.from(this.providers.values()).map(provider => provider.getInfo())
  }
}
import Anthropic from '@anthropic-ai/sdk'
import { BaseAIProvider } from './base-provider'
import type { AIMessage, AIResponse, AIStreamChunk, AIProviderConfig, AIGenerateOptions } from '@shared/types/ai'

/**
 * Anthropic Claude AI 提供者實現
 * 基於 Context7 查詢的官方 API 文件實現
 */
export class AnthropicProvider extends BaseAIProvider {
  private client: Anthropic | null = null

  constructor(config: AIProviderConfig) {
    super(config)
  }

  /**
   * 初始化 Anthropic 客戶端
   */
  async initialize(): Promise<void> {
    try {
      this.validateApiKey()
      
      this.client = new Anthropic({
        apiKey: this.config.apiKey,
        baseURL: this.config.baseUrl,
        maxRetries: 3,
        timeout: 60000, // 60 秒超時
      })

      // 測試連接
      await this.healthCheck()
      this.isInitialized = true
      
      console.log(`✅ Anthropic Provider ${this.config.name} initialized successfully`)
    } catch (error) {
      console.error(`❌ Failed to initialize Anthropic Provider: ${this.formatError(error)}`)
      throw error
    }
  }

  /**
   * 生成內容
   */
  async generateContent(
    messages: AIMessage[],
    options?: AIGenerateOptions
  ): Promise<AIResponse> {
    this.ensureInitialized()
    
    if (!this.client) {
      throw new Error('Anthropic client is not initialized')
    }

    try {
      // 轉換訊息格式為 Anthropic 格式
      const anthropicMessages = this.convertMessages(messages)
      
      // 準備請求參數
      const requestParams: Anthropic.MessageCreateParams = {
        model: this.config.model,
        max_tokens: options?.maxTokens || this.config.maxTokens || 4096,
        messages: anthropicMessages,
        temperature: options?.temperature ?? this.config.temperature ?? 0.7,
        top_p: options?.topP ?? this.config.topP,
        top_k: options?.topK ?? this.config.topK,
      }

      // 添加系統提示（如果有）
      if (options?.systemPrompt) {
        requestParams.system = options.systemPrompt
      }

      const response = await this.client.messages.create(requestParams)
      
      // 提取回應內容
      const content = this.extractContent(response)
      
      return {
        content,
        usage: {
          inputTokens: response.usage.input_tokens,
          outputTokens: response.usage.output_tokens,
          totalTokens: response.usage.input_tokens + response.usage.output_tokens,
        },
        model: response.model,
        finishReason: response.stop_reason || undefined,
      }
    } catch (error) {
      console.error(`❌ Anthropic generateContent error:`, error)
      throw new Error(this.formatError(error))
    }
  }

  /**
   * 串流生成內容
   */
  async* generateContentStream(
    messages: AIMessage[],
    options?: AIGenerateOptions
  ): AsyncGenerator<AIStreamChunk, void, unknown> {
    this.ensureInitialized()
    
    if (!this.client) {
      throw new Error('Anthropic client is not initialized')
    }

    try {
      const anthropicMessages = this.convertMessages(messages)
      
      const requestParams: Anthropic.MessageCreateParams = {
        model: this.config.model,
        max_tokens: options?.maxTokens || this.config.maxTokens || 4096,
        messages: anthropicMessages,
        temperature: options?.temperature ?? this.config.temperature ?? 0.7,
        top_p: options?.topP ?? this.config.topP,
        top_k: options?.topK ?? this.config.topK,
        stream: true,
      }

      if (options?.systemPrompt) {
        requestParams.system = options.systemPrompt
      }

      const stream = await this.client.messages.create(requestParams)
      
      let totalInputTokens = 0
      let totalOutputTokens = 0

      for await (const messageStreamEvent of stream) {
        if (messageStreamEvent.type === 'content_block_delta') {
          if (messageStreamEvent.delta.type === 'text_delta') {
            yield {
              content: messageStreamEvent.delta.text,
              isComplete: false,
            }
          }
        } else if (messageStreamEvent.type === 'message_start') {
          totalInputTokens = messageStreamEvent.message.usage.input_tokens
        } else if (messageStreamEvent.type === 'message_delta') {
          totalOutputTokens = messageStreamEvent.usage.output_tokens
        } else if (messageStreamEvent.type === 'message_stop') {
          yield {
            content: '',
            isComplete: true,
            usage: {
              inputTokens: totalInputTokens,
              outputTokens: totalOutputTokens,
              totalTokens: totalInputTokens + totalOutputTokens,
            },
          }
        }
      }
    } catch (error) {
      console.error(`❌ Anthropic generateContentStream error:`, error)
      throw new Error(this.formatError(error))
    }
  }

  /**
   * 健康檢查
   */
  async healthCheck(): Promise<boolean> {
    if (!this.client) {
      return false
    }

    try {
      // 發送簡單的測試請求
      const response = await this.client.messages.create({
        model: this.config.model,
        max_tokens: 10,
        messages: [{ role: 'user', content: 'Hi' }],
      })

      return response.content.length > 0
    } catch (error) {
      console.error(`❌ Anthropic health check failed:`, this.formatError(error))
      return false
    }
  }

  /**
   * 轉換訊息格式為 Anthropic 格式
   */
  private convertMessages(messages: AIMessage[]): Anthropic.MessageParam[] {
    return messages
      .filter(msg => msg.role !== 'system') // 系統訊息單獨處理
      .map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      }))
  }

  /**
   * 提取回應內容
   */
  private extractContent(response: Anthropic.Message): string {
    if (!response.content || response.content.length === 0) {
      return ''
    }

    // 合併所有文字內容
    return response.content
      .filter(block => block.type === 'text')
      .map(block => (block as Anthropic.TextBlock).text)
      .join('')
  }
}
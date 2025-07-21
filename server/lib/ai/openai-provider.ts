import OpenAI from 'openai'
import { BaseAIProvider } from './base-provider'
import type { AIMessage, AIResponse, AIStreamChunk, AIProviderConfig, AIGenerateOptions } from '@shared/types/ai'

/**
 * OpenAI GPT AI 提供者實現
 * 基於 Context7 查詢的官方 API 文件實現
 */
export class OpenAIProvider extends BaseAIProvider {
  private client: OpenAI | null = null

  constructor(config: AIProviderConfig) {
    super(config)
  }

  /**
   * 初始化 OpenAI 客戶端
   */
  async initialize(): Promise<void> {
    try {
      this.validateApiKey()
      
      this.client = new OpenAI({
        apiKey: this.config.apiKey,
        baseURL: this.config.baseUrl,
        maxRetries: 3,
        timeout: 60000, // 60 秒超時
      })

      // 測試連接
      await this.healthCheck()
      this.isInitialized = true
      
      console.log(`✅ OpenAI Provider ${this.config.name} initialized successfully`)
    } catch (error) {
      console.error(`❌ Failed to initialize OpenAI Provider: ${this.formatError(error)}`)
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
      throw new Error('OpenAI client is not initialized')
    }

    try {
      // 轉換訊息格式為 OpenAI 格式
      const openaiMessages = this.convertMessages(messages, options?.systemPrompt)
      
      // 準備請求參數
      const requestParams: OpenAI.Chat.ChatCompletionCreateParams = {
        model: this.config.model,
        messages: openaiMessages,
        max_tokens: options?.maxTokens || this.config.maxTokens || 4096,
        temperature: options?.temperature ?? this.config.temperature ?? 0.7,
        top_p: options?.topP ?? this.config.topP,
        stream: false,
      }

      const response = await this.client.chat.completions.create(requestParams)
      
      // 提取回應內容
      const choice = response.choices[0]
      if (!choice || !choice.message) {
        throw new Error('No response content received from OpenAI')
      }

      return {
        content: choice.message.content || '',
        usage: response.usage ? {
          inputTokens: response.usage.prompt_tokens,
          outputTokens: response.usage.completion_tokens,
          totalTokens: response.usage.total_tokens,
        } : undefined,
        model: response.model,
        finishReason: choice.finish_reason || undefined,
      }
    } catch (error) {
      console.error(`❌ OpenAI generateContent error:`, error)
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
      throw new Error('OpenAI client is not initialized')
    }

    try {
      const openaiMessages = this.convertMessages(messages, options?.systemPrompt)
      
      const requestParams: OpenAI.Chat.ChatCompletionCreateParams = {
        model: this.config.model,
        messages: openaiMessages,
        max_tokens: options?.maxTokens || this.config.maxTokens || 4096,
        temperature: options?.temperature ?? this.config.temperature ?? 0.7,
        top_p: options?.topP ?? this.config.topP,
        stream: true,
      }

      const stream = await this.client.chat.completions.create(requestParams)
      
      let totalTokens = 0

      for await (const chunk of stream) {
        const choice = chunk.choices[0]
        
        if (choice?.delta?.content) {
          yield {
            content: choice.delta.content,
            isComplete: false,
          }
        }

        // 處理串流結束
        if (choice?.finish_reason) {
          // 注意：OpenAI 串流模式下通常不提供詳細的 token 使用量
          yield {
            content: '',
            isComplete: true,
            usage: totalTokens > 0 ? {
              inputTokens: 0, // 串流模式下無法準確計算
              outputTokens: totalTokens,
              totalTokens: totalTokens,
            } : undefined,
          }
        }
      }
    } catch (error) {
      console.error(`❌ OpenAI generateContentStream error:`, error)
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
      const response = await this.client.chat.completions.create({
        model: this.config.model,
        messages: [{ role: 'user', content: 'Hi' }],
        max_tokens: 10,
      })

      return response.choices.length > 0 && response.choices[0].message?.content !== null
    } catch (error) {
      console.error(`❌ OpenAI health check failed:`, this.formatError(error))
      return false
    }
  }

  /**
   * 轉換訊息格式為 OpenAI 格式
   */
  private convertMessages(
    messages: AIMessage[], 
    systemPrompt?: string
  ): OpenAI.Chat.ChatCompletionMessageParam[] {
    const result: OpenAI.Chat.ChatCompletionMessageParam[] = []

    // 添加系統提示（如果有）
    if (systemPrompt) {
      result.push({
        role: 'system',
        content: systemPrompt,
      })
    }

    // 添加系統訊息
    const systemMessages = messages.filter(msg => msg.role === 'system')
    for (const msg of systemMessages) {
      result.push({
        role: 'system',
        content: msg.content,
      })
    }

    // 添加用戶和助手訊息
    const conversationMessages = messages.filter(msg => msg.role !== 'system')
    for (const msg of conversationMessages) {
      result.push({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      })
    }

    return result
  }

  /**
   * 格式化 OpenAI 特定錯誤
   */
  protected formatError(error: any): string {
    // OpenAI 特定錯誤處理
    if (error?.error?.message) {
      return error.error.message
    }

    if (error?.code === 'insufficient_quota') {
      return 'OpenAI API quota exceeded. Please check your billing.'
    }

    if (error?.code === 'rate_limit_exceeded') {
      return 'OpenAI API rate limit exceeded. Please try again later.'
    }

    if (error?.code === 'invalid_api_key') {
      return 'Invalid OpenAI API key. Please check your configuration.'
    }

    return super.formatError(error)
  }
}
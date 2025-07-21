import { GoogleGenerativeAI } from '@google/generative-ai'
import { BaseAIProvider } from './base-provider'
import type { AIMessage, AIResponse, AIStreamChunk, AIProviderConfig, AIGenerateOptions } from '@shared/types/ai'

/**
 * Google Gemini AI 提供者實現
 * 基於 Context7 查詢的官方 API 文件實現
 */
export class GoogleProvider extends BaseAIProvider {
  private client: GoogleGenerativeAI | null = null

  constructor(config: AIProviderConfig) {
    super(config)
  }

  /**
   * 初始化 Google Gemini 客戶端
   */
  async initialize(): Promise<void> {
    try {
      this.validateApiKey()
      
      this.client = new GoogleGenerativeAI(this.config.apiKey)

      // 測試連接
      await this.healthCheck()
      this.isInitialized = true
      
      console.log(`✅ Google Provider ${this.config.name} initialized successfully`)
    } catch (error) {
      console.error(`❌ Failed to initialize Google Provider: ${this.formatError(error)}`)
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
      throw new Error('Google client is not initialized')
    }

    try {
      // 轉換訊息格式為 Google 格式
      const { contents, systemInstruction } = this.convertMessages(messages, options?.systemPrompt)
      
      // 準備生成配置
      const generationConfig = {
        maxOutputTokens: options?.maxTokens || this.config.maxTokens || 4096,
        temperature: options?.temperature ?? this.config.temperature ?? 0.7,
        topP: options?.topP ?? this.config.topP,
        topK: options?.topK ?? this.config.topK,
      }

      // 獲取模型實例
      const model = this.client.getGenerativeModel({ 
        model: this.config.model,
        generationConfig,
        systemInstruction,
      })

      const response = await model.generateContent(contents)
      
      // 提取回應內容
      const content = response.response.text() || ''
      
      return {
        content,
        usage: response.response.usageMetadata ? {
          inputTokens: response.response.usageMetadata.promptTokenCount || 0,
          outputTokens: response.response.usageMetadata.candidatesTokenCount || 0,
          totalTokens: response.response.usageMetadata.totalTokenCount || 0,
        } : undefined,
        model: this.config.model,
        finishReason: response.response.candidates?.[0]?.finishReason || undefined,
      }
    } catch (error) {
      console.error(`❌ Google generateContent error:`, error)
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
      throw new Error('Google client is not initialized')
    }

    try {
      const { contents, systemInstruction } = this.convertMessages(messages, options?.systemPrompt)
      
      const generationConfig = {
        maxOutputTokens: options?.maxTokens || this.config.maxTokens || 4096,
        temperature: options?.temperature ?? this.config.temperature ?? 0.7,
        topP: options?.topP ?? this.config.topP,
        topK: options?.topK ?? this.config.topK,
      }

      // 獲取模型實例
      const model = this.client.getGenerativeModel({ 
        model: this.config.model,
        generationConfig,
        systemInstruction,
      })

      const stream = await model.generateContentStream(contents)
      
      let totalInputTokens = 0
      let totalOutputTokens = 0
      let isFirstChunk = true

      for await (const chunk of stream.stream) {
        const text = chunk.text() || ''
        
        if (text) {
          yield {
            content: text,
            isComplete: false,
          }
        }

        // 收集使用量資訊
        if (chunk.usageMetadata) {
          if (isFirstChunk) {
            totalInputTokens = chunk.usageMetadata.promptTokenCount || 0
            isFirstChunk = false
          }
          totalOutputTokens = chunk.usageMetadata.candidatesTokenCount || 0
        }
      }

      // 發送完成訊號
      yield {
        content: '',
        isComplete: true,
        usage: {
          inputTokens: totalInputTokens,
          outputTokens: totalOutputTokens,
          totalTokens: totalInputTokens + totalOutputTokens,
        },
      }
    } catch (error) {
      console.error(`❌ Google generateContentStream error:`, error)
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
      const model = this.client.getGenerativeModel({ 
        model: this.config.model,
        generationConfig: {
          maxOutputTokens: 10,
        },
      })

      const response = await model.generateContent('Hi')

      return response.response.text() !== undefined && response.response.text().length > 0
    } catch (error) {
      console.error(`❌ Google health check failed:`, this.formatError(error))
      return false
    }
  }

  /**
   * 轉換訊息格式為 Google 格式
   */
  private convertMessages(
    messages: AIMessage[], 
    systemPrompt?: string
  ): { contents: any[], systemInstruction?: any } {
    // 處理系統指令
    let systemInstruction: any = undefined
    
    // 優先使用傳入的系統提示
    if (systemPrompt) {
      systemInstruction = {
        parts: [{ text: systemPrompt }],
      }
    } else {
      // 查找系統訊息
      const systemMessage = messages.find(msg => msg.role === 'system')
      if (systemMessage) {
        systemInstruction = {
          parts: [{ text: systemMessage.content }],
        }
      }
    }

    // 轉換對話訊息
    const conversationMessages = messages.filter(msg => msg.role !== 'system')
    const contents = conversationMessages.map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    }))

    return { contents, systemInstruction }
  }

  /**
   * 格式化 Google 特定錯誤
   */
  protected formatError(error: any): string {
    // Google API 特定錯誤處理
    if (error?.status === 400) {
      return 'Invalid request to Google API. Please check your input.'
    }

    if (error?.status === 401) {
      return 'Invalid Google API key. Please check your configuration.'
    }

    if (error?.status === 403) {
      return 'Google API access forbidden. Please check your permissions.'
    }

    if (error?.status === 429) {
      return 'Google API rate limit exceeded. Please try again later.'
    }

    if (error?.status === 500) {
      return 'Google API internal server error. Please try again later.'
    }

    // 檢查是否為配額錯誤
    if (error?.message?.includes('quota') || error?.message?.includes('limit')) {
      return 'Google API quota exceeded. Please check your billing.'
    }

    return super.formatError(error)
  }
}
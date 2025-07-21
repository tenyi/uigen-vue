import { BaseAIProvider } from './base-provider'
import type { AIMessage, AIResponse, AIStreamChunk, AIProviderConfig, AIGenerateOptions } from '@shared/types/ai'

/**
 * 模擬 AI 提供者實現
 * 用作備援系統，當所有真實提供者都不可用時使用
 */
export class MockProvider extends BaseAIProvider {
  private mockResponses: string[] = [
    "I'm a mock AI assistant. I can help you with various tasks, but please note that I'm running in simulation mode.",
    "This is a simulated response from the backup AI system. The main AI providers are currently unavailable.",
    "Hello! I'm the fallback AI assistant. While I can provide basic responses, please try again later for full AI capabilities.",
    "I'm operating in mock mode. This means the primary AI services are temporarily unavailable, but I can still assist with basic queries.",
    "This is a test response from the backup system. For full AI functionality, please ensure your API keys are configured correctly.",
  ]

  constructor(config: AIProviderConfig) {
    super(config)
  }

  /**
   * 初始化模擬提供者（總是成功）
   */
  async initialize(): Promise<void> {
    // 模擬初始化延遲
    await new Promise(resolve => setTimeout(resolve, 100))
    
    this.isInitialized = true
    console.log(`✅ Mock Provider ${this.config.name} initialized successfully`)
  }

  /**
   * 生成模擬內容
   */
  async generateContent(
    messages: AIMessage[],
    _options?: AIGenerateOptions
  ): Promise<AIResponse> {
    this.ensureInitialized()

    // 模擬處理延遲
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000))

    try {
      const lastMessage = messages[messages.length - 1]
      const response = this.generateMockResponse(lastMessage?.content || '')

      // 模擬 token 計算
      const inputTokens = this.estimateTokens(messages.map(m => m.content).join(' '))
      const outputTokens = this.estimateTokens(response)

      return {
        content: response,
        usage: {
          inputTokens,
          outputTokens,
          totalTokens: inputTokens + outputTokens,
        },
        model: this.config.model,
        finishReason: 'stop',
      }
    } catch (error) {
      console.error(`❌ Mock generateContent error:`, error)
      throw new Error(this.formatError(error))
    }
  }

  /**
   * 串流生成模擬內容
   */
  async* generateContentStream(
    messages: AIMessage[],
    _options?: AIGenerateOptions
  ): AsyncGenerator<AIStreamChunk, void, unknown> {
    this.ensureInitialized()

    try {
      const lastMessage = messages[messages.length - 1]
      const response = this.generateMockResponse(lastMessage?.content || '')
      
      // 模擬串流：逐字輸出
      const words = response.split(' ')
      const inputTokens = this.estimateTokens(messages.map(m => m.content).join(' '))
      let outputTokens = 0

      for (let i = 0; i < words.length; i++) {
        const word = words[i] + (i < words.length - 1 ? ' ' : '')
        outputTokens += this.estimateTokens(word)
        
        // 模擬延遲
        await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 100))
        
        yield {
          content: word,
          isComplete: false,
        }
      }

      // 發送完成訊號
      yield {
        content: '',
        isComplete: true,
        usage: {
          inputTokens,
          outputTokens,
          totalTokens: inputTokens + outputTokens,
        },
      }
    } catch (error) {
      console.error(`❌ Mock generateContentStream error:`, error)
      throw new Error(this.formatError(error))
    }
  }

  /**
   * 健康檢查（總是返回 true）
   */
  async healthCheck(): Promise<boolean> {
    // 模擬檢查延遲
    await new Promise(resolve => setTimeout(resolve, 100))
    return true
  }

  /**
   * 生成模擬回應
   */
  private generateMockResponse(userInput: string): string {
    // 基於用戶輸入生成相應的模擬回應
    const input = userInput.toLowerCase()

    if (input.includes('hello') || input.includes('hi') || input.includes('你好')) {
      return "Hello! I'm the mock AI assistant. I'm currently running in simulation mode because the main AI providers are unavailable. How can I help you today?"
    }

    if (input.includes('help') || input.includes('幫助')) {
      return "I'm here to help! However, please note that I'm operating in mock mode. This means I can provide basic responses, but for full AI capabilities, you'll need to configure proper API keys for services like OpenAI, Anthropic, or Google."
    }

    if (input.includes('test') || input.includes('測試')) {
      return "This is a test response from the mock AI provider. The system is working correctly, but you're seeing this because the primary AI services are not available. Please check your API configuration."
    }

    if (input.includes('code') || input.includes('程式') || input.includes('programming')) {
      return "I can discuss programming concepts in mock mode, but for actual code generation and analysis, you'll need access to the full AI providers. Please ensure your API keys are properly configured."
    }

    if (input.includes('error') || input.includes('錯誤') || input.includes('problem')) {
      return "It seems you're experiencing an issue. Since I'm running in mock mode, this likely means there's a problem with the AI provider configuration. Please check your API keys and network connectivity."
    }

    // 隨機選擇一個通用回應
    const randomIndex = Math.floor(Math.random() * this.mockResponses.length)
    return this.mockResponses[randomIndex]
  }

  /**
   * 估算 token 數量（簡單實現）
   */
  private estimateTokens(text: string): number {
    // 簡單的 token 估算：大約 4 個字符 = 1 個 token
    return Math.ceil(text.length / 4)
  }

  /**
   * 格式化錯誤訊息
   */
  protected formatError(error: any): string {
    return `Mock Provider Error: ${error.message || 'Unknown error in mock mode'}`
  }
}
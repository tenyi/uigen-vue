import { describe, it, expect, beforeEach, vi } from 'vitest'
import { BaseAIProvider } from '@server/lib/ai/base-provider'
import { MockProvider } from '@server/lib/ai/mock-provider'
import { AnthropicProvider } from '@server/lib/ai/anthropic-provider'
import { OpenAIProvider } from '@server/lib/ai/openai-provider'
import { GoogleProvider } from '@server/lib/ai/google-provider'
import type { AIProviderConfig, AIMessage } from '@shared/types/ai'
import { AI_PROVIDERS, AI_MODELS } from '@shared/types/ai'

// Mock 外部依賴
vi.mock('@anthropic-ai/sdk')
vi.mock('openai')
vi.mock('@google/generative-ai')

describe('AI Providers', () => {
  const mockConfig: AIProviderConfig = {
    id: 'test-provider',
    name: 'Test Provider',
    apiKey: 'test-api-key',
    model: 'test-model',
    isActive: true,
    priority: 1,
    maxTokens: 1000,
    temperature: 0.7,
    rateLimitPerMinute: 60,
    rateLimitPerHour: 1000,
    costPerInputToken: 0.001,
    costPerOutputToken: 0.002,
  }

  const testMessages: AIMessage[] = [
    { role: 'user', content: 'Hello, how are you?' },
    { role: 'assistant', content: 'I am doing well, thank you!' },
    { role: 'user', content: 'Can you help me with a task?' },
  ]

  describe('BaseAIProvider', () => {
    class TestProvider extends BaseAIProvider {
      async initialize(): Promise<void> {
        this.isInitialized = true
      }

      async generateContent(): Promise<any> {
        this.ensureInitialized()
        return { content: 'test response' }
      }

      async* generateContentStream(): AsyncGenerator<any> {
        this.ensureInitialized()
        yield { content: 'test', isComplete: false }
        yield { content: '', isComplete: true }
      }

      async healthCheck(): Promise<boolean> {
        return true
      }
    }

    let provider: TestProvider

    beforeEach(() => {
      provider = new TestProvider(mockConfig)
    })

    it('should initialize with correct config', () => {
      expect(provider.getInfo()).toEqual(mockConfig)
    })

    it('should update config correctly', () => {
      const newConfig = { name: 'Updated Provider', temperature: 0.5 }
      provider.updateConfig(newConfig)
      
      const updatedInfo = provider.getInfo()
      expect(updatedInfo.name).toBe('Updated Provider')
      expect(updatedInfo.temperature).toBe(0.5)
      expect(updatedInfo.id).toBe(mockConfig.id) // 其他屬性保持不變
    })

    it('should throw error when not initialized', async () => {
      const uninitializedProvider = new TestProvider(mockConfig)
      // 不調用 initialize()
      
      await expect(uninitializedProvider.generateContent(testMessages)).rejects.toThrow(
        'AI Provider Test Provider is not initialized'
      )
    })

    it('should validate API key', () => {
      const configWithoutKey = { ...mockConfig, apiKey: '' }
      const providerWithoutKey = new TestProvider(configWithoutKey)
      
      expect(() => providerWithoutKey['validateApiKey']()).toThrow(
        'API key is required for Test Provider'
      )
    })

    it('should calculate cost correctly', () => {
      const inputTokens = 100
      const outputTokens = 50
      const expectedCost = (100 * 0.001) + (50 * 0.002) // 0.1 + 0.1 = 0.2
      
      const cost = provider['calculateCost'](inputTokens, outputTokens)
      expect(cost).toBe(expectedCost)
    })

    it('should check rate limits', () => {
      // 測試正常情況
      expect(() => provider['checkRateLimit'](30, 'minute')).not.toThrow()
      expect(() => provider['checkRateLimit'](500, 'hour')).not.toThrow()
      
      // 測試超出限制
      expect(() => provider['checkRateLimit'](70, 'minute')).toThrow(
        'Rate limit exceeded for Test Provider: 70/60 requests per minute'
      )
      expect(() => provider['checkRateLimit'](1100, 'hour')).toThrow(
        'Rate limit exceeded for Test Provider: 1100/1000 requests per hour'
      )
    })
  })

  describe('MockProvider', () => {
    let mockProvider: MockProvider

    beforeEach(async () => {
      mockProvider = new MockProvider({
        ...mockConfig,
        id: AI_PROVIDERS.MOCK,
        name: 'Mock Provider',
        model: 'mock-model',
      })
      await mockProvider.initialize()
    })

    it('should initialize successfully', () => {
      expect(mockProvider.getInfo().name).toBe('Mock Provider')
    })

    it('should generate content', async () => {
      const response = await mockProvider.generateContent(testMessages)
      
      expect(response.content).toBeTruthy()
      expect(response.usage).toBeDefined()
      expect(response.usage!.inputTokens).toBeGreaterThan(0)
      expect(response.usage!.outputTokens).toBeGreaterThan(0)
      expect(response.model).toBe('mock-model')
      expect(response.finishReason).toBe('stop')
    })

    it('should generate content stream', async () => {
      const chunks: any[] = []
      
      for await (const chunk of mockProvider.generateContentStream(testMessages)) {
        chunks.push(chunk)
      }
      
      expect(chunks.length).toBeGreaterThan(1)
      expect(chunks[chunks.length - 1].isComplete).toBe(true)
      expect(chunks[chunks.length - 1].usage).toBeDefined()
    })

    it('should pass health check', async () => {
      const isHealthy = await mockProvider.healthCheck()
      expect(isHealthy).toBe(true)
    })

    it('should generate different responses for different inputs', async () => {
      const helloMessages: AIMessage[] = [{ role: 'user', content: 'Hello' }]
      const helpMessages: AIMessage[] = [{ role: 'user', content: 'I need help' }]
      
      const helloResponse = await mockProvider.generateContent(helloMessages)
      const helpResponse = await mockProvider.generateContent(helpMessages)
      
      expect(helloResponse.content).toContain('Hello')
      expect(helpResponse.content).toContain('help')
    })
  })

  describe('AnthropicProvider', () => {
    let anthropicProvider: AnthropicProvider

    beforeEach(() => {
      anthropicProvider = new AnthropicProvider({
        ...mockConfig,
        id: AI_PROVIDERS.ANTHROPIC,
        name: 'Anthropic Claude',
        model: AI_MODELS.CLAUDE_3_5_SONNET,
      })
    })

    it('should create provider with correct config', () => {
      const info = anthropicProvider.getInfo()
      expect(info.id).toBe(AI_PROVIDERS.ANTHROPIC)
      expect(info.model).toBe(AI_MODELS.CLAUDE_3_5_SONNET)
    })

    it('should require API key for initialization', async () => {
      const providerWithoutKey = new AnthropicProvider({
        ...mockConfig,
        apiKey: '',
      })
      
      await expect(providerWithoutKey.initialize()).rejects.toThrow(
        'API key is required for Test Provider'
      )
    })

    // 注意：實際的 API 測試需要真實的 API 金鑰，這裡只測試配置
  })

  describe('OpenAIProvider', () => {
    let openaiProvider: OpenAIProvider

    beforeEach(() => {
      openaiProvider = new OpenAIProvider({
        ...mockConfig,
        id: AI_PROVIDERS.OPENAI,
        name: 'OpenAI GPT',
        model: AI_MODELS.GPT_4O,
      })
    })

    it('should create provider with correct config', () => {
      const info = openaiProvider.getInfo()
      expect(info.id).toBe(AI_PROVIDERS.OPENAI)
      expect(info.model).toBe(AI_MODELS.GPT_4O)
    })

    it('should require API key for initialization', async () => {
      const providerWithoutKey = new OpenAIProvider({
        ...mockConfig,
        apiKey: '',
      })
      
      await expect(providerWithoutKey.initialize()).rejects.toThrow(
        'API key is required for Test Provider'
      )
    })
  })

  describe('GoogleProvider', () => {
    let googleProvider: GoogleProvider

    beforeEach(() => {
      googleProvider = new GoogleProvider({
        ...mockConfig,
        id: AI_PROVIDERS.GOOGLE,
        name: 'Google Gemini',
        model: AI_MODELS.GEMINI_2_0_FLASH,
      })
    })

    it('should create provider with correct config', () => {
      const info = googleProvider.getInfo()
      expect(info.id).toBe(AI_PROVIDERS.GOOGLE)
      expect(info.model).toBe(AI_MODELS.GEMINI_2_0_FLASH)
    })

    it('should require API key for initialization', async () => {
      const providerWithoutKey = new GoogleProvider({
        ...mockConfig,
        apiKey: '',
      })
      
      await expect(providerWithoutKey.initialize()).rejects.toThrow(
        'API key is required for Test Provider'
      )
    })
  })

  describe('AI Types and Constants', () => {
    it('should have correct AI provider constants', () => {
      expect(AI_PROVIDERS.ANTHROPIC).toBe('anthropic')
      expect(AI_PROVIDERS.OPENAI).toBe('openai')
      expect(AI_PROVIDERS.GOOGLE).toBe('google')
      expect(AI_PROVIDERS.MOCK).toBe('mock')
    })

    it('should have correct AI model constants', () => {
      expect(AI_MODELS.CLAUDE_3_5_SONNET).toBe('claude-3-5-sonnet-20241022')
      expect(AI_MODELS.GPT_4O).toBe('gpt-4o')
      expect(AI_MODELS.GEMINI_2_0_FLASH).toBe('gemini-2.0-flash-001')
    })
  })
})
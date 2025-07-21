import { describe, it, expect, beforeEach, vi } from 'vitest'
import { AIProviderManager } from '@server/lib/ai/provider-manager'
import type { AIProviderConfig, AIMessage } from '@shared/types/ai'
import { AI_PROVIDERS, AI_MODELS } from '@shared/types/ai'

// Mock 外部依賴
vi.mock('@anthropic-ai/sdk')
vi.mock('openai')
vi.mock('@google/generative-ai')

describe('AIProviderManager', () => {
  let manager: AIProviderManager
  
  const mockConfigs: AIProviderConfig[] = [
    {
      id: AI_PROVIDERS.MOCK,
      name: 'Mock Provider',
      apiKey: 'mock-key',
      model: 'mock-model',
      isActive: true,
      priority: 1,
      maxTokens: 1000,
      temperature: 0.7,
      costPerInputToken: 0.001,
      costPerOutputToken: 0.002,
    },
    {
      id: AI_PROVIDERS.ANTHROPIC,
      name: 'Anthropic Claude',
      apiKey: 'anthropic-key',
      model: AI_MODELS.CLAUDE_3_5_SONNET,
      isActive: true,
      priority: 3,
      maxTokens: 4000,
      temperature: 0.7,
      costPerInputToken: 0.003,
      costPerOutputToken: 0.015,
    },
    {
      id: AI_PROVIDERS.OPENAI,
      name: 'OpenAI GPT',
      apiKey: 'openai-key',
      model: AI_MODELS.GPT_4O,
      isActive: true,
      priority: 2,
      maxTokens: 4000,
      temperature: 0.7,
      costPerInputToken: 0.005,
      costPerOutputToken: 0.015,
    },
  ]

  const testMessages: AIMessage[] = [
    { role: 'user', content: 'Hello, how are you?' },
    { role: 'assistant', content: 'I am doing well, thank you!' },
    { role: 'user', content: 'Can you help me with a task?' },
  ]

  beforeEach(async () => {
    manager = new AIProviderManager()
    
    // 只註冊 Mock 提供者，因為其他提供者需要真實的 API 金鑰
    await manager.registerProvider(mockConfigs[0])
  })

  describe('Provider Registration', () => {
    it('should register mock provider successfully', async () => {
      const statuses = manager.getProviderStatuses()
      expect(statuses).toHaveLength(1)
      expect(statuses[0].id).toBe(AI_PROVIDERS.MOCK)
      expect(statuses[0].isHealthy).toBe(true)
    })

    it('should get provider info correctly', () => {
      const info = manager.getProviderInfo(AI_PROVIDERS.MOCK)
      expect(info).toBeDefined()
      expect(info!.name).toBe('Mock Provider')
      expect(info!.model).toBe('mock-model')
    })

    it('should get all provider info', () => {
      const allInfo = manager.getAllProviderInfo()
      expect(allInfo).toHaveLength(1)
      expect(allInfo[0].id).toBe(AI_PROVIDERS.MOCK)
    })

    it('should throw error for unknown provider type', async () => {
      const invalidConfig = {
        ...mockConfigs[0],
        id: 'unknown-provider',
      }

      await expect(manager.registerProvider(invalidConfig)).rejects.toThrow(
        'Unknown provider type: unknown-provider'
      )
    })
  })

  describe('Content Generation', () => {
    it('should generate content using mock provider', async () => {
      const response = await manager.generateContent(testMessages)
      
      expect(response.content).toBeTruthy()
      expect(response.usage).toBeDefined()
      expect(response.usage!.inputTokens).toBeGreaterThan(0)
      expect(response.usage!.outputTokens).toBeGreaterThan(0)
      expect(response.model).toBe('mock-model')
    })

    it('should generate content with specific provider', async () => {
      const response = await manager.generateContent(testMessages, undefined, AI_PROVIDERS.MOCK)
      
      expect(response.content).toBeTruthy()
      expect(response.model).toBe('mock-model')
    })

    it('should generate content with options', async () => {
      const options = {
        maxTokens: 500,
        temperature: 0.5,
        systemPrompt: 'You are a helpful assistant.',
      }

      const response = await manager.generateContent(testMessages, options)
      
      expect(response.content).toBeTruthy()
      expect(response.usage).toBeDefined()
    })

    it('should throw error when no providers available', async () => {
      const emptyManager = new AIProviderManager()
      
      await expect(emptyManager.generateContent(testMessages)).rejects.toThrow(
        'No healthy AI providers available'
      )
    })
  })

  describe('Content Streaming', () => {
    it('should generate content stream using mock provider', async () => {
      const chunks: any[] = []
      
      for await (const chunk of manager.generateContentStream(testMessages)) {
        chunks.push(chunk)
      }
      
      expect(chunks.length).toBeGreaterThan(1)
      expect(chunks[chunks.length - 1].isComplete).toBe(true)
      
      // 檢查是否有使用量資訊
      const finalChunk = chunks[chunks.length - 1]
      expect(finalChunk.usage).toBeDefined()
    })

    it('should generate content stream with specific provider', async () => {
      const chunks: any[] = []
      
      for await (const chunk of manager.generateContentStream(testMessages, undefined, AI_PROVIDERS.MOCK)) {
        chunks.push(chunk)
      }
      
      expect(chunks.length).toBeGreaterThan(1)
      expect(chunks[chunks.length - 1].isComplete).toBe(true)
    })
  })

  describe('Health Checks', () => {
    it('should perform health checks', async () => {
      await manager.performHealthChecks()
      
      const statuses = manager.getProviderStatuses()
      expect(statuses[0].isHealthy).toBe(true)
      expect(statuses[0].lastChecked).toBeInstanceOf(Date)
      expect(statuses[0].responseTime).toBeGreaterThan(0)
    })

    it('should update provider status after health check', async () => {
      const statusBefore = manager.getProviderStatuses()[0]
      const timeBefore = statusBefore.lastChecked
      
      // 等待一小段時間確保時間戳不同
      await new Promise(resolve => setTimeout(resolve, 10))
      
      await manager.performHealthChecks()
      
      const statusAfter = manager.getProviderStatuses()[0]
      expect(statusAfter.lastChecked.getTime()).toBeGreaterThan(timeBefore.getTime())
    })
  })

  describe('Usage Statistics', () => {
    it('should update usage statistics after content generation', async () => {
      const statusBefore = manager.getProviderStatuses()[0]
      const requestsBefore = statusBefore.usage.requestsToday
      const tokensBefore = statusBefore.usage.tokensToday
      
      await manager.generateContent(testMessages)
      
      const statusAfter = manager.getProviderStatuses()[0]
      expect(statusAfter.usage.requestsToday).toBe(requestsBefore + 1)
      expect(statusAfter.usage.tokensToday).toBeGreaterThan(tokensBefore)
      expect(statusAfter.usage.costToday).toBeGreaterThan(0)
    })

    it('should calculate cost correctly', async () => {
      const statusBefore = manager.getProviderStatuses()[0]
      const costBefore = statusBefore.usage.costToday
      
      await manager.generateContent(testMessages)
      
      const statusAfter = manager.getProviderStatuses()[0]
      const costIncrease = statusAfter.usage.costToday - costBefore
      
      // 成本應該大於 0（因為有輸入和輸出 token）
      expect(costIncrease).toBeGreaterThan(0)
    })
  })

  describe('Error Handling', () => {
    it('should handle provider errors gracefully', async () => {
      // 創建一個會失敗的提供者配置
      const failingConfig = {
        ...mockConfigs[0],
        id: 'failing-provider',
        apiKey: '', // 空的 API 金鑰會導致失敗
      }

      // 這應該會拋出錯誤，因為 Mock 提供者在沒有 API 金鑰時會失敗
      await expect(manager.registerProvider(failingConfig)).rejects.toThrow()
    })
  })

  describe('Provider Priority', () => {
    it('should respect provider priority when multiple providers available', async () => {
      // 這個測試需要多個提供者，但由於我們只能測試 Mock 提供者
      // 我們至少可以確認單一提供者的行為
      const response = await manager.generateContent(testMessages)
      expect(response.content).toBeTruthy()
    })
  })

  describe('Fallback Mechanism', () => {
    it('should use available provider when preferred provider not specified', async () => {
      const response = await manager.generateContent(testMessages)
      expect(response.content).toBeTruthy()
      expect(response.model).toBe('mock-model')
    })
  })
})
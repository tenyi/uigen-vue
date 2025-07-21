import type { AITool, AIToolCall, AIToolResult } from '@shared/types/ai'

/**
 * AI 工具抽象基類
 * 所有 AI 工具都必須實現此介面
 */
export abstract class BaseTool {
  protected name: string
  protected description: string

  constructor(name: string, description: string) {
    this.name = name
    this.description = description
  }

  /**
   * 獲取工具定義
   */
  abstract getDefinition(): AITool

  /**
   * 執行工具
   * @param toolCall 工具呼叫資訊
   */
  abstract execute(toolCall: AIToolCall): Promise<AIToolResult>

  /**
   * 驗證工具參數
   * @param args 工具參數
   */
  protected abstract validateArguments(args: Record<string, any>): boolean

  /**
   * 格式化錯誤結果
   * @param toolCallId 工具呼叫 ID
   * @param error 錯誤訊息
   */
  protected formatError(toolCallId: string, error: string): AIToolResult {
    return {
      toolCallId,
      result: null,
      error
    }
  }

  /**
   * 格式化成功結果
   * @param toolCallId 工具呼叫 ID
   * @param result 結果資料
   */
  protected formatSuccess(toolCallId: string, result: any): AIToolResult {
    return {
      toolCallId,
      result,
      error: undefined
    }
  }
}
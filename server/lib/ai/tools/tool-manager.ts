import { BaseTool } from './base-tool'
import { StrReplaceEditorTool } from './str-replace-editor'
import { FileManagerTool } from './file-manager'
import type { AITool, AIToolCall, AIToolResult } from '@shared/types/ai'
import { AI_TOOLS } from '@shared/types/ai'
import { VirtualFileSystem } from '../../../../src/lib/file-system'

/**
 * AI 工具管理器
 * 負責管理和執行所有可用的 AI 工具
 */
export class ToolManager {
  private tools: Map<string, BaseTool> = new Map()
  private fileSystem: VirtualFileSystem

  constructor(fileSystem: VirtualFileSystem) {
    this.fileSystem = fileSystem
    this.initializeTools()
  }

  /**
   * 初始化所有工具
   */
  private initializeTools(): void {
    // 註冊字串替換編輯器工具
    const strReplaceEditor = new StrReplaceEditorTool(this.fileSystem)
    this.tools.set(AI_TOOLS.STR_REPLACE_EDITOR, strReplaceEditor)

    // 註冊檔案管理器工具
    const fileManager = new FileManagerTool(this.fileSystem)
    this.tools.set(AI_TOOLS.FILE_MANAGER, fileManager)

    console.log(`🔧 Tool Manager initialized with ${this.tools.size} tools`)
  }

  /**
   * 獲取所有可用工具的定義
   */
  getAvailableTools(): AITool[] {
    return Array.from(this.tools.values()).map(tool => tool.getDefinition())
  }

  /**
   * 獲取特定工具的定義
   * @param toolName 工具名稱
   */
  getToolDefinition(toolName: string): AITool | null {
    const tool = this.tools.get(toolName)
    return tool ? tool.getDefinition() : null
  }

  /**
   * 執行工具呼叫
   * @param toolCall 工具呼叫資訊
   */
  async executeTool(toolCall: AIToolCall): Promise<AIToolResult> {
    const tool = this.tools.get(toolCall.name)
    
    if (!tool) {
      return {
        toolCallId: toolCall.id,
        result: null,
        error: `未知的工具: ${toolCall.name}`
      }
    }

    try {
      return await tool.execute(toolCall)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      return {
        toolCallId: toolCall.id,
        result: null,
        error: `執行工具 ${toolCall.name} 時發生錯誤: ${errorMessage}`
      }
    }
  }

  /**
   * 批量執行多個工具呼叫
   * @param toolCalls 工具呼叫陣列
   */
  async executeTools(toolCalls: AIToolCall[]): Promise<AIToolResult[]> {
    const results: AIToolResult[] = []
    
    for (const toolCall of toolCalls) {
      const result = await this.executeTool(toolCall)
      results.push(result)
    }
    
    return results
  }

  /**
   * 檢查工具是否可用
   * @param toolName 工具名稱
   */
  isToolAvailable(toolName: string): boolean {
    return this.tools.has(toolName)
  }

  /**
   * 獲取工具統計資訊
   */
  getToolStats(): { totalTools: number; availableTools: string[] } {
    return {
      totalTools: this.tools.size,
      availableTools: Array.from(this.tools.keys())
    }
  }

  /**
   * 更新檔案系統實例
   * @param fileSystem 新的檔案系統實例
   */
  updateFileSystem(fileSystem: VirtualFileSystem): void {
    this.fileSystem = fileSystem
    
    // 重新初始化工具以使用新的檔案系統
    this.tools.clear()
    this.initializeTools()
  }
}
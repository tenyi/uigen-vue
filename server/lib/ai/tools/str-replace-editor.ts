import { BaseTool } from './base-tool'
import type { AITool, AIToolCall, AIToolResult } from '@shared/types/ai'
import { VirtualFileSystem } from '../../../../src/lib/file-system'

/**
 * 字串替換編輯器工具
 * 用於編輯檔案內容，支援精確的字串替換操作
 */
export class StrReplaceEditorTool extends BaseTool {
  private fileSystem: VirtualFileSystem

  constructor(fileSystem: VirtualFileSystem) {
    super('str_replace_editor', '字串替換編輯器，用於精確編輯檔案內容')
    this.fileSystem = fileSystem
  }

  /**
   * 獲取工具定義
   */
  getDefinition(): AITool {
    return {
      name: this.name,
      description: this.description,
      parameters: {
        type: 'object',
        properties: {
          command: {
            type: 'string',
            enum: ['str_replace', 'view', 'create'],
            description: '操作命令：str_replace(替換文字)、view(查看檔案)、create(建立檔案)'
          },
          path: {
            type: 'string',
            description: '檔案路徑'
          },
          old_str: {
            type: 'string',
            description: '要替換的原始字串 (僅用於 str_replace 命令)'
          },
          new_str: {
            type: 'string',
            description: '新的替換字串 (僅用於 str_replace 命令)'
          },
          file_text: {
            type: 'string',
            description: '檔案內容 (僅用於 create 命令)'
          },
          view_range: {
            type: 'array',
            items: { type: 'number' },
            description: '查看範圍 [start_line, end_line] (可選，用於 view 命令)'
          }
        },
        required: ['command', 'path']
      }
    }
  }

  /**
   * 執行工具
   */
  async execute(toolCall: AIToolCall): Promise<AIToolResult> {
    try {
      if (!this.validateArguments(toolCall.arguments)) {
        return this.formatError(toolCall.id, '無效的工具參數')
      }

      const { command, path, old_str, new_str, file_text, view_range } = toolCall.arguments

      switch (command) {
        case 'view':
          return await this.viewFile(toolCall.id, path, view_range)
        
        case 'create':
          return await this.createFile(toolCall.id, path, file_text)
        
        case 'str_replace':
          return await this.replaceString(toolCall.id, path, old_str, new_str)
        
        default:
          return this.formatError(toolCall.id, `不支援的命令: ${command}`)
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      return this.formatError(toolCall.id, `執行工具時發生錯誤: ${errorMessage}`)
    }
  }

  /**
   * 驗證工具參數
   */
  protected validateArguments(args: Record<string, any>): boolean {
    const { command, path } = args

    if (!command || !path) {
      return false
    }

    switch (command) {
      case 'str_replace':
        return typeof args.old_str === 'string' && typeof args.new_str === 'string'
      case 'create':
        return typeof args.file_text === 'string'
      case 'view':
        return true
      default:
        return false
    }
  }

  /**
   * 查看檔案內容
   */
  private async viewFile(toolCallId: string, path: string, viewRange?: number[]): Promise<AIToolResult> {
    try {
      const content = this.fileSystem.readFile(path)
      let result = `檔案: ${path}\n內容:\n${content}`

      if (viewRange && viewRange.length === 2) {
        const lines = content.split('\n')
        const [startLine, endLine] = viewRange
        const selectedLines = lines.slice(startLine - 1, endLine)
        result = `檔案: ${path} (行 ${startLine}-${endLine})\n內容:\n${selectedLines.join('\n')}`
      }

      return this.formatSuccess(toolCallId, result)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      return this.formatError(toolCallId, `查看檔案失敗: ${errorMessage}`)
    }
  }

  /**
   * 建立檔案
   */
  private async createFile(toolCallId: string, path: string, content: string): Promise<AIToolResult> {
    try {
      // 檢查檔案是否已存在
      try {
        this.fileSystem.readFile(path)
        return this.formatError(toolCallId, `檔案已存在: ${path}`)
      } catch {
        // 檔案不存在，可以建立
      }

      // 建立檔案
      this.fileSystem.createFile(path, content)
      
      return this.formatSuccess(toolCallId, `成功建立檔案: ${path}`)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      return this.formatError(toolCallId, `建立檔案失敗: ${errorMessage}`)
    }
  }

  /**
   * 替換字串
   */
  private async replaceString(toolCallId: string, path: string, oldStr: string, newStr: string): Promise<AIToolResult> {
    try {
      const content = this.fileSystem.readFile(path)

      // 檢查原始字串是否存在
      if (!content.includes(oldStr)) {
        return this.formatError(toolCallId, `在檔案 ${path} 中找不到指定的字串`)
      }

      // 執行替換
      const newContent = content.replace(oldStr, newStr)
      this.fileSystem.updateFile(path, newContent)

      return this.formatSuccess(toolCallId, `成功替換檔案 ${path} 中的內容`)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      return this.formatError(toolCallId, `替換字串失敗: ${errorMessage}`)
    }
  }
}
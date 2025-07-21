import { BaseTool } from './base-tool'
import type { AITool, AIToolCall, AIToolResult } from '@shared/types/ai'
import { VirtualFileSystem } from '../../../../src/lib/file-system'

/**
 * 檔案管理器工具
 * 用於檔案和目錄的管理操作
 */
export class FileManagerTool extends BaseTool {
  private fileSystem: VirtualFileSystem

  constructor(fileSystem: VirtualFileSystem) {
    super('file_manager', '檔案管理器，用於檔案和目錄的管理操作')
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
            enum: ['list', 'delete', 'move', 'copy', 'mkdir', 'exists'],
            description: '操作命令：list(列出檔案)、delete(刪除)、move(移動)、copy(複製)、mkdir(建立目錄)、exists(檢查存在)'
          },
          path: {
            type: 'string',
            description: '檔案或目錄路徑'
          },
          destination: {
            type: 'string',
            description: '目標路徑 (用於 move 和 copy 命令)'
          },
          recursive: {
            type: 'boolean',
            description: '是否遞迴操作 (用於 list 和 delete 命令)',
            default: false
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

      const { command, path, destination, recursive } = toolCall.arguments

      switch (command) {
        case 'list':
          return await this.listFiles(toolCall.id, path, recursive)
        
        case 'delete':
          return await this.deleteFile(toolCall.id, path)
        
        case 'move':
          return await this.moveFile(toolCall.id, path, destination)
        
        case 'copy':
          return await this.copyFile(toolCall.id, path, destination)
        
        case 'mkdir':
          return await this.createDirectory(toolCall.id, path)
        
        case 'exists':
          return await this.checkExists(toolCall.id, path)
        
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

    // 檢查需要 destination 參數的命令
    if (['move', 'copy'].includes(command) && !args.destination) {
      return false
    }

    return true
  }

  /**
   * 列出檔案和目錄
   */
  private async listFiles(toolCallId: string, path: string, _recursive: boolean = false): Promise<AIToolResult> {
    try {
      // 使用虛擬檔案系統的 listDirectory 方法
      const items = this.fileSystem.listDirectory(path)
      
      if (items.length === 0) {
        return this.formatSuccess(toolCallId, `目錄 ${path} 是空的或不存在`)
      }

      const fileList = items.map((item) => {
        return {
          path: item.path,
          type: item.isDirectory ? 'directory' : 'file',
          size: item.isDirectory ? 0 : (item as any).size || 0,
          lastModified: item.lastModified
        }
      })

      return this.formatSuccess(toolCallId, {
        path,
        files: fileList,
        count: fileList.length
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      return this.formatError(toolCallId, `列出檔案失敗: ${errorMessage}`)
    }
  }

  /**
   * 刪除檔案
   */
  private async deleteFile(toolCallId: string, path: string): Promise<AIToolResult> {
    try {
      const success = this.fileSystem.deleteFile(path)
      if (!success) {
        return this.formatError(toolCallId, `檔案不存在: ${path}`)
      }
      return this.formatSuccess(toolCallId, `成功刪除檔案: ${path}`)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      return this.formatError(toolCallId, `刪除檔案失敗: ${errorMessage}`)
    }
  }

  /**
   * 移動檔案
   */
  private async moveFile(toolCallId: string, sourcePath: string, destinationPath: string): Promise<AIToolResult> {
    try {
      // 檢查目標檔案是否已存在
      try {
        this.fileSystem.readFile(destinationPath)
        return this.formatError(toolCallId, `目標檔案已存在: ${destinationPath}`)
      } catch {
        // 目標檔案不存在，可以移動
      }

      // 使用檔案系統的 move 方法
      const success = this.fileSystem.move(sourcePath, destinationPath)
      if (!success) {
        return this.formatError(toolCallId, `來源檔案不存在: ${sourcePath}`)
      }

      return this.formatSuccess(toolCallId, `成功移動檔案從 ${sourcePath} 到 ${destinationPath}`)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      return this.formatError(toolCallId, `移動檔案失敗: ${errorMessage}`)
    }
  }

  /**
   * 複製檔案
   */
  private async copyFile(toolCallId: string, sourcePath: string, destinationPath: string): Promise<AIToolResult> {
    try {
      // 檢查目標檔案是否已存在
      try {
        this.fileSystem.readFile(destinationPath)
        return this.formatError(toolCallId, `目標檔案已存在: ${destinationPath}`)
      } catch {
        // 目標檔案不存在，可以複製
      }

      // 使用檔案系統的 copyFile 方法
      this.fileSystem.copyFile(sourcePath, destinationPath)

      return this.formatSuccess(toolCallId, `成功複製檔案從 ${sourcePath} 到 ${destinationPath}`)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      return this.formatError(toolCallId, `複製檔案失敗: ${errorMessage}`)
    }
  }

  /**
   * 建立目錄
   */
  private async createDirectory(toolCallId: string, path: string): Promise<AIToolResult> {
    try {
      this.fileSystem.createDirectory(path)
      return this.formatSuccess(toolCallId, `成功建立目錄: ${path}`)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      if (errorMessage.includes('already exists')) {
        return this.formatError(toolCallId, `目錄已存在: ${path}`)
      }
      return this.formatError(toolCallId, `建立目錄失敗: ${errorMessage}`)
    }
  }

  /**
   * 檢查檔案是否存在
   */
  private async checkExists(toolCallId: string, path: string): Promise<AIToolResult> {
    try {
      let exists = false
      try {
        this.fileSystem.readFile(path)
        exists = true
      } catch {
        // 檢查是否為目錄
        try {
          this.fileSystem.listDirectory(path)
          exists = true
        } catch {
          exists = false
        }
      }
      
      return this.formatSuccess(toolCallId, {
        path,
        exists,
        message: exists ? `檔案存在: ${path}` : `檔案不存在: ${path}`
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      return this.formatError(toolCallId, `檢查檔案存在失敗: ${errorMessage}`)
    }
  }
}
import { describe, it, expect, beforeEach } from 'vitest'
import { VirtualFileSystem } from '../../src/lib/file-system'
import { ToolManager } from '../../server/lib/ai/tools/tool-manager'
import { StrReplaceEditorTool } from '../../server/lib/ai/tools/str-replace-editor'
import { FileManagerTool } from '../../server/lib/ai/tools/file-manager'
import { AI_TOOLS } from '@shared/types/ai'
import type { AIToolCall } from '@shared/types/ai'

describe('AI Tools', () => {
  let fileSystem: VirtualFileSystem
  let toolManager: ToolManager

  beforeEach(() => {
    fileSystem = new VirtualFileSystem()
    toolManager = new ToolManager(fileSystem)
  })

  describe('ToolManager', () => {
    it('should initialize with available tools', () => {
      const tools = toolManager.getAvailableTools()
      expect(tools).toHaveLength(2)
      expect(tools.map(t => t.name)).toContain(AI_TOOLS.STR_REPLACE_EDITOR)
      expect(tools.map(t => t.name)).toContain(AI_TOOLS.FILE_MANAGER)
    })

    it('should check tool availability', () => {
      expect(toolManager.isToolAvailable(AI_TOOLS.STR_REPLACE_EDITOR)).toBe(true)
      expect(toolManager.isToolAvailable(AI_TOOLS.FILE_MANAGER)).toBe(true)
      expect(toolManager.isToolAvailable('unknown_tool')).toBe(false)
    })

    it('should return tool stats', () => {
      const stats = toolManager.getToolStats()
      expect(stats.totalTools).toBe(2)
      expect(stats.availableTools).toContain(AI_TOOLS.STR_REPLACE_EDITOR)
      expect(stats.availableTools).toContain(AI_TOOLS.FILE_MANAGER)
    })
  })

  describe('StrReplaceEditorTool', () => {
    let tool: StrReplaceEditorTool

    beforeEach(() => {
      tool = new StrReplaceEditorTool(fileSystem)
    })

    it('should create a new file', async () => {
      const toolCall: AIToolCall = {
        id: 'test-1',
        name: AI_TOOLS.STR_REPLACE_EDITOR,
        arguments: {
          command: 'create',
          path: 'test.vue',
          file_text: '<template>\n  <div>Hello World</div>\n</template>'
        }
      }

      const result = await tool.execute(toolCall)
      expect(result.error).toBeUndefined()
      expect(result.result).toContain('成功建立檔案: test.vue')
      
      const content = fileSystem.readFile('test.vue')
      expect(content).toBeTruthy()
      expect(content).toContain('Hello World')
    })

    it('should view file content', async () => {
      // 先建立檔案
      fileSystem.createFile('test.vue', '<template>\n  <div>Test Content</div>\n</template>')

      const toolCall: AIToolCall = {
        id: 'test-2',
        name: AI_TOOLS.STR_REPLACE_EDITOR,
        arguments: {
          command: 'view',
          path: 'test.vue'
        }
      }

      const result = await tool.execute(toolCall)
      expect(result.error).toBeUndefined()
      expect(result.result).toContain('Test Content')
    })

    it('should replace string in file', async () => {
      // 先建立檔案
      fileSystem.createFile('test.vue', '<template>\n  <div>Old Content</div>\n</template>')

      const toolCall: AIToolCall = {
        id: 'test-3',
        name: AI_TOOLS.STR_REPLACE_EDITOR,
        arguments: {
          command: 'str_replace',
          path: 'test.vue',
          old_str: 'Old Content',
          new_str: 'New Content'
        }
      }

      const result = await tool.execute(toolCall)
      expect(result.error).toBeUndefined()
      expect(result.result).toContain('成功替換檔案')
      
      const content = fileSystem.readFile('test.vue')
      expect(content).toContain('New Content')
      expect(content).not.toContain('Old Content')
    })

    it('should handle file not found error', async () => {
      const toolCall: AIToolCall = {
        id: 'test-4',
        name: AI_TOOLS.STR_REPLACE_EDITOR,
        arguments: {
          command: 'view',
          path: 'nonexistent.vue'
        }
      }

      const result = await tool.execute(toolCall)
      expect(result.error).toBeTruthy()
      expect(result.error).toContain('File not found')
    })
  })

  describe('FileManagerTool', () => {
    let tool: FileManagerTool

    beforeEach(() => {
      tool = new FileManagerTool(fileSystem)
    })

    it('should check if file exists', async () => {
      // 建立測試檔案
      fileSystem.createFile('test.vue', 'content')

      const toolCall: AIToolCall = {
        id: 'test-5',
        name: AI_TOOLS.FILE_MANAGER,
        arguments: {
          command: 'exists',
          path: 'test.vue'
        }
      }

      const result = await tool.execute(toolCall)
      expect(result.error).toBeUndefined()
      expect(result.result.exists).toBe(true)
    })

    it('should list files', async () => {
      // 建立測試檔案
      fileSystem.createFile('/list-test/file1.vue', 'content1')
      fileSystem.createFile('/list-test/file2.vue', 'content2')

      const toolCall: AIToolCall = {
        id: 'test-6',
        name: AI_TOOLS.FILE_MANAGER,
        arguments: {
          command: 'list',
          path: '/list-test'
        }
      }

      const result = await tool.execute(toolCall)
      expect(result.error).toBeUndefined()
      expect(result.result).toBeTruthy()
      expect(result.result.files).toBeTruthy()
      expect(result.result.files.length).toBe(2)
    })

    it('should delete file', async () => {
      // 建立測試檔案
      fileSystem.createFile('to-delete.vue', 'content')

      const toolCall: AIToolCall = {
        id: 'test-7',
        name: AI_TOOLS.FILE_MANAGER,
        arguments: {
          command: 'delete',
          path: 'to-delete.vue'
        }
      }

      const result = await tool.execute(toolCall)
      expect(result.error).toBeUndefined()
      expect(result.result).toContain('成功刪除檔案')
      
      try {
        fileSystem.readFile('to-delete.vue')
        expect(false).toBe(true) // 應該拋出錯誤
      } catch (error) {
        expect(error.message).toContain('File not found')
      }
    })

    it('should copy file', async () => {
      // 建立來源檔案
      fileSystem.createFile('source.vue', 'source content')

      const toolCall: AIToolCall = {
        id: 'test-8',
        name: AI_TOOLS.FILE_MANAGER,
        arguments: {
          command: 'copy',
          path: 'source.vue',
          destination: 'copy.vue'
        }
      }

      const result = await tool.execute(toolCall)
      expect(result.error).toBeUndefined()
      expect(result.result).toContain('成功複製檔案')
      
      const sourceContent = fileSystem.readFile('source.vue')
      const copyContent = fileSystem.readFile('copy.vue')
      expect(sourceContent).toBeTruthy()
      expect(copyContent).toBeTruthy()
      expect(copyContent).toBe(sourceContent)
    })

    it('should move file', async () => {
      // 建立來源檔案
      fileSystem.createFile('source.vue', 'source content')

      const toolCall: AIToolCall = {
        id: 'test-9',
        name: AI_TOOLS.FILE_MANAGER,
        arguments: {
          command: 'move',
          path: 'source.vue',
          destination: 'moved.vue'
        }
      }

      const result = await tool.execute(toolCall)
      expect(result.error).toBeUndefined()
      expect(result.result).toContain('成功移動檔案')
      
      try {
        fileSystem.readFile('source.vue')
        expect(false).toBe(true) // 原檔案應該不存在
      } catch (error) {
        expect(error.message).toContain('File not found')
      }
      
      const movedContent = fileSystem.readFile('moved.vue')
      expect(movedContent).toBeTruthy()
      expect(movedContent).toBe('source content')
    })
  })
})
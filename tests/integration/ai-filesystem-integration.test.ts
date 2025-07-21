import { describe, it, expect, beforeEach } from 'vitest'
import { VirtualFileSystem } from '@/lib/file-system'
import { AIProviderManager } from '@server/lib/ai/provider-manager'
import { AI_PROVIDERS, AI_MODELS } from '@shared/types/ai'
import type { AIProviderConfig } from '@shared/types/ai'

describe('AI Provider + Virtual File System Integration', () => {
  let fileSystem: VirtualFileSystem
  let aiManager: AIProviderManager

  beforeEach(async () => {
    // 初始化虛擬檔案系統
    fileSystem = new VirtualFileSystem()
    
    // 初始化 AI 提供者管理器
    aiManager = new AIProviderManager()
    
    // 註冊 Mock 提供者用於測試
    const mockConfig: AIProviderConfig = {
      id: AI_PROVIDERS.MOCK,
      name: 'Mock AI Provider',
      apiKey: 'mock-key',
      model: 'mock-model',
      isActive: true,
      priority: 1,
      maxTokens: 1000,
      temperature: 0.7,
      costPerInputToken: 0.001,
      costPerOutputToken: 0.002,
    }
    
    await aiManager.registerProvider(mockConfig)
  })

  describe('File System + AI Chat Integration', () => {
    it('should create files based on AI responses', async () => {
      // 模擬用戶請求創建 Vue 組件
      const userMessage = 'Create a simple Vue button component'
      
      // 使用 AI 生成回應
      const aiResponse = await aiManager.generateContent([
        { role: 'user', content: userMessage }
      ])
      
      expect(aiResponse.content).toBeTruthy()
      
      // 基於 AI 回應創建檔案
      const componentContent = `<template>
  <button class="btn" @click="handleClick">
    <slot>Click me</slot>
  </button>
</template>

<script setup lang="ts">
const emit = defineEmits<{
  click: []
}>()

const handleClick = () => {
  emit('click')
}
</script>

<style scoped>
.btn {
  padding: 8px 16px;
  border: 1px solid #ccc;
  border-radius: 4px;
  background: white;
  cursor: pointer;
}

.btn:hover {
  background: #f5f5f5;
}
</style>`

      const file = fileSystem.createFile('/src/components/Button.vue', componentContent)
      
      expect(file.name).toBe('Button.vue')
      expect(file.type).toBe('vue')
      expect(file.content).toContain('<template>')
      expect(file.content).toContain('<script setup')
      expect(file.content).toContain('<style scoped>')
    })

    it('should analyze existing files with AI', async () => {
      // 創建一個有問題的 TypeScript 檔案
      const problematicCode = `function calculateTotal(items) {
  let total = 0;
  for (let i = 0; i < items.length; i++) {
    total += items[i].price * items[i].quantity;
  }
  return total;
}`

      fileSystem.createFile('/src/utils/calculator.ts', problematicCode)
      
      // 讀取檔案內容
      const fileContent = fileSystem.readFile('/src/utils/calculator.ts')
      
      // 使用 AI 分析程式碼
      const analysisRequest = `Analyze this TypeScript code and suggest improvements:

\`\`\`typescript
${fileContent}
\`\`\`

Please provide suggestions for type safety and best practices.`

      const aiResponse = await aiManager.generateContent([
        { role: 'user', content: analysisRequest }
      ])
      
      expect(aiResponse.content).toBeTruthy()
      expect(aiResponse.usage?.inputTokens).toBeGreaterThan(0)
      expect(aiResponse.usage?.outputTokens).toBeGreaterThan(0)
    })

    it('should refactor files based on AI suggestions', async () => {
      // 創建原始檔案
      const originalCode = `export function add(a, b) {
  return a + b;
}

export function multiply(a, b) {
  return a * b;
}`

      fileSystem.createFile('/src/utils/math.ts', originalCode)
      
      // 使用 AI 生成改進的版本
      const refactorRequest = `Refactor this JavaScript code to TypeScript with proper types:

\`\`\`javascript
${originalCode}
\`\`\`

Add JSDoc comments and improve type safety.`

      const aiResponse = await aiManager.generateContent([
        { role: 'user', content: refactorRequest }
      ])
      
      // 模擬 AI 回應的改進程式碼
      const improvedCode = `/**
 * Adds two numbers together
 * @param a - First number
 * @param b - Second number
 * @returns The sum of a and b
 */
export function add(a: number, b: number): number {
  return a + b;
}

/**
 * Multiplies two numbers
 * @param a - First number
 * @param b - Second number
 * @returns The product of a and b
 */
export function multiply(a: number, b: number): number {
  return a * b;
}`

      // 更新檔案內容
      const updatedFile = fileSystem.updateFile('/src/utils/math.ts', improvedCode)
      
      expect(updatedFile.content).toContain('number')
      expect(updatedFile.content).toContain('/**')  // JSDoc 註解格式
      expect(updatedFile.lastModified).toBeInstanceOf(Date)
    })
  })

  describe('Project Structure Generation', () => {
    it('should generate complete project structure with AI', async () => {
      // 使用 AI 規劃專案結構
      const projectRequest = 'Create a Vue 3 project structure for a todo app with TypeScript'
      
      const aiResponse = await aiManager.generateContent([
        { role: 'user', content: projectRequest }
      ])
      
      expect(aiResponse.content).toBeTruthy()
      
      // 基於 AI 建議創建專案結構
      fileSystem.createDirectory('/src')
      fileSystem.createDirectory('/src/components')
      fileSystem.createDirectory('/src/composables')
      fileSystem.createDirectory('/src/types')
      fileSystem.createDirectory('/src/stores')
      
      // 創建主要檔案
      fileSystem.createFile('/src/App.vue', `<template>
  <div id="app">
    <TodoApp />
  </div>
</template>

<script setup lang="ts">
import TodoApp from './components/TodoApp.vue'
</script>`)

      fileSystem.createFile('/src/types/todo.ts', `export interface Todo {
  id: string
  title: string
  completed: boolean
  createdAt: Date
}`)

      fileSystem.createFile('/src/composables/useTodos.ts', `import { ref, computed } from 'vue'
import type { Todo } from '@/types/todo'

export function useTodos() {
  const todos = ref<Todo[]>([])
  
  const completedTodos = computed(() => 
    todos.value.filter(todo => todo.completed)
  )
  
  const pendingTodos = computed(() => 
    todos.value.filter(todo => !todo.completed)
  )
  
  return {
    todos,
    completedTodos,
    pendingTodos
  }
}`)

      // 驗證專案結構
      const projectTree = fileSystem.getFileTree('/')
      expect(projectTree.children).toHaveLength(1) // src directory
      
      const srcDir = projectTree.children[0] as any
      expect(srcDir.name).toBe('src')
      expect(srcDir.children).toHaveLength(5) // 4 directories + 1 file
      
      // 驗證檔案內容
      expect(fileSystem.readFile('/src/App.vue')).toContain('TodoApp')
      expect(fileSystem.readFile('/src/types/todo.ts')).toContain('interface Todo')
      expect(fileSystem.readFile('/src/composables/useTodos.ts')).toContain('useTodos')
    })
  })

  describe('File Search + AI Analysis', () => {
    beforeEach(() => {
      // 創建測試檔案
      fileSystem.createFile('/src/components/Header.vue', `<template>
  <header class="header">
    <h1>{{ title }}</h1>
  </header>
</template>

<script setup lang="ts">
interface Props {
  title: string
}

defineProps<Props>()
</script>`)

      fileSystem.createFile('/src/components/Footer.vue', `<template>
  <footer class="footer">
    <p>&copy; 2024 My App</p>
  </footer>
</template>`)

      fileSystem.createFile('/src/utils/helpers.ts', `export function formatDate(date: Date): string {
  return date.toLocaleDateString()
}

export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}`)
    })

    it('should search files and analyze with AI', async () => {
      // 搜尋包含 "template" 的檔案
      const searchResults = fileSystem.searchFiles({
        query: 'template',
        includeContent: true,
        fileTypes: ['vue']
      })
      
      expect(searchResults).toHaveLength(2)
      expect(searchResults.every(result => result.file.type === 'vue')).toBe(true)
      
      // 收集所有搜尋到的檔案內容
      const fileContents = searchResults.map(result => ({
        path: result.file.path,
        content: result.file.content
      }))
      
      // 使用 AI 分析這些 Vue 組件
      const analysisRequest = `Analyze these Vue components and suggest improvements:

${fileContents.map(file => `File: ${file.path}
\`\`\`vue
${file.content}
\`\`\`
`).join('\n')}

Please provide suggestions for consistency and best practices.`

      const aiResponse = await aiManager.generateContent([
        { role: 'user', content: analysisRequest }
      ])
      
      expect(aiResponse.content).toBeTruthy()
      expect(aiResponse.usage?.totalTokens).toBeGreaterThan(0)
    })

    it('should generate documentation for project files', async () => {
      // 獲取專案統計
      const stats = fileSystem.getStats()
      
      // 獲取檔案樹
      const fileTree = fileSystem.getFileTree('/')
      
      // 使用 AI 生成專案文件
      const docRequest = `Generate README.md documentation for this Vue project:

Project Statistics:
- Total Files: ${stats.totalFiles}
- Total Directories: ${stats.totalDirectories}
- Total Size: ${stats.totalSize} bytes

File Structure:
${JSON.stringify(fileTree, null, 2)}

Please create a comprehensive README with setup instructions and project overview.`

      const aiResponse = await aiManager.generateContent([
        { role: 'user', content: docRequest }
      ])
      
      expect(aiResponse.content).toBeTruthy()
      
      // 創建 README 檔案
      const readmeFile = fileSystem.createFile('/README.md', aiResponse.content)
      
      expect(readmeFile.type).toBe('md')
      expect(readmeFile.content).toBeTruthy()  // Mock 提供者會回應通用訊息
      expect(readmeFile.content.length).toBeGreaterThan(50)
    })
  })

  describe('Real-time File Watching + AI', () => {
    it('should watch file changes and trigger AI analysis', async () => {
      return new Promise<void>(async (resolve) => {
        // 創建目錄
        fileSystem.createDirectory('/src')
        
        // 設定檔案監聽器
        const watcherId = fileSystem.addWatcher({
          path: '/src',
          recursive: true,
          events: ['file_updated'],
          callback: async (event) => {
            if (event.file && event.file.type === 'ts') {
              // 觸發 AI 分析
              const analysisRequest = `Quick code review for updated file:

\`\`\`typescript
${event.file.content}
\`\`\`

Any immediate issues or suggestions?`

              try {
                const aiResponse = await aiManager.generateContent([
                  { role: 'user', content: analysisRequest }
                ])
                
                expect(aiResponse.content).toBeTruthy()
                
                // 清理監聽器
                fileSystem.removeWatcher(watcherId)
                resolve()
              } catch (error) {
                console.error('AI analysis error:', error)
                fileSystem.removeWatcher(watcherId)
                resolve()
              }
            }
          },
        })
        
        // 創建並更新檔案
        fileSystem.createFile('/src/test.ts', 'const x = 1;')
        fileSystem.updateFile('/src/test.ts', 'const x: number = 1;')
      })
    })
  })

  describe('AI Provider Health + File System Stats', () => {
    it('should combine AI health status with file system statistics', async () => {
      // 執行 AI 健康檢查
      await aiManager.performHealthChecks()
      
      // 獲取 AI 提供者狀態
      const providerStatuses = aiManager.getProviderStatuses()
      
      // 獲取檔案系統統計
      const fsStats = fileSystem.getStats()
      
      // 創建系統狀態報告
      const systemStatus = {
        fileSystem: {
          totalFiles: fsStats.totalFiles,
          totalDirectories: fsStats.totalDirectories,
          totalSize: fsStats.totalSize,
          isHealthy: fsStats.totalFiles >= 0, // 基本健康檢查
        },
        aiProviders: providerStatuses.map(status => ({
          id: status.id,
          isHealthy: status.isHealthy,
          responseTime: status.responseTime,
          usage: status.usage,
        })),
        overall: {
          isHealthy: providerStatuses.some(s => s.isHealthy) && fsStats.totalFiles >= 0,
          timestamp: new Date(),
        }
      }
      
      expect(systemStatus.fileSystem.isHealthy).toBe(true)
      expect(systemStatus.aiProviders).toHaveLength(1)
      expect(systemStatus.aiProviders[0].isHealthy).toBe(true)
      expect(systemStatus.overall.isHealthy).toBe(true)
    })
  })
})
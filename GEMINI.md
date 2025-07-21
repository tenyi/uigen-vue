# GEMINI.md - UIGen Vue 版本規格

此檔案為 Gemini Code (claude.ai/code) 在 UIGen Vue 版本程式碼庫中工作時提供指導。

## 技術堆疊概覽

UIGen Vue 是一個 AI 驅動的 Vue 組件生成器，具有即時預覽功能。這是從 Next.js/React 版本移植而來的 Vue 3 實現。

- **框架**: Vue 3 + Vite
- **語言**: TypeScript
- **樣式**: Tailwind CSS v4
- **狀態管理**: Pinia
- **路由**: Vue Router 4
- **資料庫**: Prisma with SQLite (後端 API)
- **後端**: Express.js + TypeScript
- **AI 整合**: 多提供者支援 (Anthropic Gemini, OpenAI GPT-4, Google Gemini) 與備用模擬提供者
- **測試**: Vitest + Vue Test Utils
- **UI 組件**: 自定義組件庫 (基於 Radix Vue)
- **MCP 整合**: Model Context Protocol 伺服器增強功能

## 主要架構模式

### 1. 前後端分離架構

- **前端**: Vue 3 SPA 應用 (port 5173)
- **後端**: Express.js API 伺服器 (port 3001)
- **API 通訊**: RESTful API + WebSocket (用於即時聊天)
- **認證**: JWT Token 基礎認證

### 2. Pinia 狀態管理

- **檔案系統 Store** (`src/stores/file-system.ts`): Vue 組件程式碼的虛擬檔案系統
- **聊天 Store** (`src/stores/chat.ts`): AI 聊天狀態與訊息
- **使用者 Store** (`src/stores/user.ts`): 使用者認證狀態
- **專案 Store** (`src/stores/project.ts`): 專案管理狀態
- 使用 `VirtualFileSystem` 類別進行記憶體內檔案操作

### 3. AI 整合 (後端)

- **多提供者支援**: `server/lib/provider.ts` 處理 AI 模型選擇，優先順序如下：
  1. **Anthropic Gemini** (gemini-3-5-sonnet-20241022) - 如果設定了 ANTHROPIC_API_KEY 則為首選
  2. **OpenAI GPT-4** (gpt-4o) - 如果設定了 OPENAI_API_KEY 則為備選
  3. **Google Gemini** (gemini-1.5-pro) - 如果設定了 GEMINI_API_KEY 則為備選
  4. **模擬提供者** - 當沒有提供 API 金鑰時的靜態回應
- **模擬系統**: 本地化中文回應，減少步驟數 (4 vs 40) 以防止重複
- **工具呼叫**: 支援透過結構化工具進行檔案建立/修改 (`str_replace_editor`, `file_manager`)
- **串流回應**: 使用 WebSocket 進行即時 AI 回應串流

### 4. 身份驗證

- JWT Token 基礎認證系統
- 前端路由守衛保護需要認證的頁面
- 支援匿名使用者與本地儲存追蹤
- Axios 攔截器自動處理 Token

## 專案結構

```
uigen-vue/
├── src/                          # Vue 前端應用
│   ├── components/               # Vue 組件
│   │   ├── ui/                  # 基礎 UI 組件
│   │   ├── chat/                # 聊天相關組件
│   │   ├── editor/              # 程式碼編輯器組件
│   │   ├── preview/             # 預覽相關組件
│   │   └── auth/                # 認證相關組件
│   ├── stores/                  # Pinia 狀態管理
│   ├── views/                   # 頁面組件
│   ├── router/                  # Vue Router 配置
│   ├── lib/                     # 工具函數與類別
│   │   ├── file-system.ts       # 虛擬檔案系統
│   │   ├── api.ts               # API 客戶端
│   │   └── utils.ts             # 工具函數
│   ├── composables/             # Vue 組合式函數
│   └── types/                   # TypeScript 類型定義
├── server/                      # Express.js 後端
│   ├── routes/                  # API 路由
│   ├── middleware/              # 中介軟體
│   ├── lib/                     # 後端工具函數
│   │   ├── provider.ts          # AI 提供者管理
│   │   ├── auth.ts              # 認證邏輯
│   │   └── tools/               # AI 工具
│   ├── prisma/                  # 資料庫配置
│   └── types/                   # 後端類型定義
├── shared/                      # 前後端共用類型
└── tests/                       # 測試檔案
```

## 常用指令

| 指令 | 用途 |
|------|------|
| `npm run dev` | 同時啟動前端 (Vite) 和後端 (Express) 開發伺服器 |
| `npm run dev:frontend` | 僅啟動 Vue 前端開發伺服器 |
| `npm run dev:backend` | 僅啟動 Express 後端開發伺服器 |
| `npm run build` | 建置前端生產版本 |
| `npm run build:backend` | 建置後端生產版本 |
| `npm run test` | 使用 Vitest 執行所有測試 |
| `npm run test:frontend` | 執行前端測試 |
| `npm run test:backend` | 執行後端測試 |
| `npm run lint` | 執行 ESLint |
| `npm run setup` | 安裝依賴、生成 Prisma 客戶端、執行遷移 |
| `npm run db:reset` | 重置資料庫 |

### 測試指令

- 單一測試: `npm test [檔案名稱]` 或使用 Vitest UI
- 監視模式: `npm run test` (已在監視模式)
- 測試特定組件: `npm test ChatInterface`

## 核心組件流程 (Vue 版本)

1. **根路由** (`src/views/Home.vue`) → 處理身份驗證重導向
2. **主要佈局** (`src/views/Main.vue`) → 主要應用佈局
3. **聊天介面** (`src/components/chat/ChatInterface.vue`) + **檔案樹** + **預覽框架**
4. **狀態層級**: Pinia Stores → VirtualFileSystem → API Client

### 關鍵檔案 (Vue 版本)

- **虛擬檔案系統**: `src/lib/file-system.ts` - 記憶體內檔案操作 (與 React 版本相同)
- **AI 模型**: `server/lib/provider.ts` - 模型選擇 (真實/模擬)
- **轉換**: `src/lib/transform/vue-transformer.ts` - Vue SFC 轉換
- **API 客戶端**: `src/lib/api.ts` - 前端 API 通訊
- **資料庫架構**: `server/prisma/schema.prisma` - 使用者/專案實體

## Vue 特定實現細節

### 1. Vue 組件生成

- 生成 Vue 3 Single File Components (SFC)
- 支援 `<template>`, `<script setup>`, `<style>` 區塊
- 使用 Composition API
- 支援 TypeScript

### 2. 即時預覽系統

- 使用 `@vue/compiler-sfc` 動態編譯 Vue 組件
- 沙盒化預覽環境
- 熱重載支援

### 3. 狀態管理模式

```typescript
// 範例: Chat Store
export const useChatStore = defineStore('chat', () => {
  const messages = ref<Message[]>([])
  const isLoading = ref(false)
  const socket = ref<WebSocket | null>(null)

  const sendMessage = async (content: string) => {
    // WebSocket 通訊邏輯
  }

  return {
    messages,
    isLoading,
    sendMessage
  }
})
```

### 4. 組合式函數

```typescript
// 範例: useFileSystem
export function useFileSystem() {
  const fileSystemStore = useFileSystemStore()

  const createFile = (path: string, content: string) => {
    // 檔案建立邏輯
  }

  return {
    files: computed(() => fileSystemStore.files),
    createFile,
    // 其他檔案操作
  }
}
```

## 環境變數

### 前端 (.env)
```env
VITE_API_BASE_URL=http://localhost:3001
VITE_WS_URL=ws://localhost:3001
```

### 後端 (.env)
```env
# AI 提供者金鑰 (按優先順序)
ANTHROPIC_API_KEY=your-anthropic-api-key-here    # 首選
OPENAI_API_KEY=your-openai-api-key-here          # 備選方案 1
GEMINI_API_KEY=your-gemini-api-key-here          # 備選方案 2

# 資料庫
DATABASE_URL="file:./dev.db"

# JWT
JWT_SECRET=your-jwt-secret-here

# 伺服器配置
PORT=3001
FRONTEND_URL=http://localhost:5173
```

## 開發工作流程

### 設定新功能

1. 在 `server/prisma/schema.prisma` 中新增資料庫架構變更
2. 執行遷移: `npx prisma migrate dev`
3. 在 `server/routes/` 中新增 API 端點
4. 在 `src/stores/` 中更新 Pinia store
5. 在 `src/components/` 中新增 Vue 組件
6. 根據需要更新路由配置

### 新增新組件

- 將組件放置在 `src/components/[類別]/` 下
- 使用 Vue 3 Composition API
- 在相鄰的 `__tests__/` 目錄中新增測試
- 遵循 Vue 3 最佳實踐

### API 開發

- 在 `server/routes/` 中定義路由
- 使用 Express.js 中介軟體
- 遵循 RESTful API 設計原則
- 使用 WebSocket 進行即時通訊

## MCP 整合

專案在 `.mcp.json` 中包含 Model Context Protocol 伺服器配置：

- **serena**: 具有 WorkCalendar 上下文的 IDE 助手
- **context7**: Upstash Context7 用於文件存取
- **fetch**: 網頁內容擷取功能
- **sequential-thinking**: 進階推理支援
- **time**: 時區處理 (預設為 Asia/Taipei)

## 部署注意事項

- 前端使用 Vite 建置系統
- 後端使用 Node.js/Express
- 資料庫為基於檔案的 SQLite
- 多提供者 AI 備援系統確保在沒有 API 金鑰時仍能運作
- 為中文使用者本地化，提供適當的模擬回應
- 支援 Docker 容器化部署

## Vue 3 最佳實踐

1. **使用 Composition API**: 所有新組件都應使用 `<script setup>` 語法
2. **類型安全**: 充分利用 TypeScript 進行類型檢查
3. **響應式**: 正確使用 `ref`, `reactive`, `computed` 等響應式 API
4. **組合式函數**: 將可重用邏輯抽取到組合式函數中
5. **單一職責**: 每個組件應該有明確的單一職責
6. **測試**: 為所有組件編寫單元測試

## 從 React 版本的主要差異

1. **狀態管理**: 從 React Context 改為 Pinia
2. **組件語法**: 從 JSX 改為 Vue SFC
3. **路由**: 從 Next.js App Router 改為 Vue Router
4. **建置工具**: 從 Next.js 改為 Vite
5. **後端分離**: 從 Next.js API Routes 改為獨立的 Express.js 伺服器
6. **即時通訊**: 新增 WebSocket 支援
7. **組件生成**: 從 React 組件改為 Vue 組件生成

## AI 提示詞調整

為了生成 Vue 組件而非 React 組件，需要調整 AI 提示詞：

### 原始 React 提示詞模式
```
生成一個 React 組件，使用 JSX 語法...
```

### Vue 版本提示詞模式
```
生成一個 Vue 3 組件，使用 Single File Component (SFC) 格式，包含：
- <template> 區塊使用 Vue 模板語法
- <script setup> 區塊使用 Composition API 和 TypeScript
- <style scoped> 區塊使用 Tailwind CSS
```

## 技術債務與改進機會

1. **SSR 支援**: 考慮使用 Nuxt.js 進行伺服器端渲染
2. **PWA 功能**: 新增離線支援和安裝功能
3. **即時協作**: 多使用者即時編輯功能
4. **組件庫**: 建立可重用的 Vue 組件庫
5. **效能優化**: 虛擬滾動、懶載入等優化
6. **國際化**: 多語言支援 (i18n)

## 遷移策略

### 階段 1: 基礎架構
- 設定 Vue 3 + Vite 專案
- 建立 Express.js 後端
- 實現基本的 Pinia stores

### 階段 2: 核心功能
- 移植虛擬檔案系統
- 實現聊天介面
- 建立 Vue 組件預覽系統

### 階段 3: AI 整合
- 移植 AI 提供者系統
- 調整提示詞以生成 Vue 組件
- 實現 WebSocket 串流

### 階段 4: 進階功能
- 使用者認證與專案管理
- 測試覆蓋率
- 部署配置

這個規格文件提供了從 React 版本遷移到 Vue 版本的完整指導，保持了原有的核心功能同時充分利用 Vue 3 的特性和生態系統。

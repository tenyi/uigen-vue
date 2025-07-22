# UIGen Vue - AI 驅動的 Vue 組件生成器

UIGen Vue 是一個強大的 AI 驅動 Vue 組件生成器，具有即時預覽功能。這是從 Next.js/React 版本移植而來的 Vue 3 實現，提供直觀的聊天介面來生成和編輯 Vue 組件。

## ✨ 主要特色

- 🤖 **多 AI 提供者支援**: 支援 Anthropic Claude、OpenAI GPT-4、Google Gemini，並提供模擬模式
- 🔥 **即時預覽**: 動態編譯和預覽生成的 Vue 組件
- 💬 **智能聊天介面**: 透過自然語言描述來生成和修改組件
- 📁 **虛擬檔案系統**: 記憶體內檔案管理，支援多檔案專案
- 🎨 **Tailwind CSS 整合**: 內建樣式系統支援
- 🔐 **使用者認證**: JWT 基礎的使用者管理系統 <- 目前未實作
- 📱 **響應式設計**: 適配各種螢幕尺寸
- 🧪 **完整測試覆蓋**: Vitest + Vue Test Utils

## 🛠 技術堆疊

### 前端
- **Vue 3** - 漸進式 JavaScript 框架
- **TypeScript** - 類型安全的 JavaScript
- **Vite** - 快速的建置工具
- **Pinia** - Vue 狀態管理
- **Vue Router 4** - 官方路由解決方案
- **Tailwind CSS v4** - 實用優先的 CSS 框架

### 後端
- **Express.js** - Node.js Web 框架
- **Prisma** - 現代資料庫工具包
- **SQLite** - 輕量級資料庫
- **WebSocket** - 即時通訊
- **JWT** - JSON Web Token 認證

### AI 整合
- **Anthropic Claude** (claude-3-5-sonnet-20241022) - 首選 AI 模型
- **OpenAI GPT-4** (gpt-4o) - 備選 AI 模型
- **Google Gemini** (gemini-1.5-pro) - 備選 AI 模型
- **模擬提供者** - 本地開發模式

## 🚀 快速開始

### 環境需求

- Node.js 18+ 
- npm 或 yarn

### 安裝與設定

1. **複製專案**
```bash
git clone <repository-url>
cd uigen-vue
```

2. **安裝依賴**
```bash
npm install
```

3. **設定環境變數**

複製環境變數範例檔案：
```bash
cp .env.example .env
```

編輯 `.env` 檔案，設定 AI 提供者 API 金鑰：
```env
# AI 提供者金鑰 (按優先順序，至少設定一個)
ANTHROPIC_API_KEY=your-anthropic-api-key-here    # 首選
OPENAI_API_KEY=your-openai-api-key-here          # 備選方案 1
GEMINI_API_KEY=your-gemini-api-key-here          # 備選方案 2

# 資料庫
DATABASE_URL="file:./dev.db"

# JWT 密鑰
JWT_SECRET=your-jwt-secret-here

# 伺服器配置
PORT=3001
FRONTEND_URL=http://localhost:5173
```

4. **初始化資料庫**
```bash
npm run setup
```

5. **啟動開發伺服器**
```bash
npm run dev
```

應用程式將在以下位址啟動：
- 前端: http://localhost:5173
- 後端 API: http://localhost:3001

## 📋 可用指令

| 指令 | 說明 |
|------|------|
| `npm run dev` | 同時啟動前端和後端開發伺服器 |
| `npm run dev:frontend` | 僅啟動 Vue 前端開發伺服器 |
| `npm run dev:backend` | 僅啟動 Express 後端開發伺服器 |
| `npm run build` | 建置前端生產版本 |
| `npm run build:backend` | 建置後端生產版本 |
| `npm run test:once` | 執行所有測試 |
| `npm run test:frontend` | 執行前端測試 |
| `npm run test:backend` | 執行後端測試 |
| `npm run lint` | 執行程式碼檢查 |
| `npm run setup` | 完整專案設定 (安裝依賴 + 資料庫初始化) |
| `npm run db:reset` | 重置資料庫 |

## 🏗 專案架構

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
│   ├── composables/             # Vue 組合式函數
│   └── types/                   # TypeScript 類型定義
├── server/                      # Express.js 後端
│   ├── routes/                  # API 路由
│   ├── middleware/              # 中介軟體
│   ├── lib/                     # 後端工具函數
│   └── prisma/                  # 資料庫配置
├── shared/                      # 前後端共用類型
└── tests/                       # 測試檔案
```

## 🎯 核心功能

### AI 組件生成
- 透過自然語言描述生成 Vue 3 組件
- 支援 Single File Component (SFC) 格式
- 自動生成 TypeScript 類型定義
- 整合 Tailwind CSS 樣式

### 即時預覽系統
- 使用 `@vue/compiler-sfc` 動態編譯
- 沙盒化預覽環境
- 熱重載支援
- 錯誤處理與除錯資訊

### 虛擬檔案系統
- 記憶體內檔案操作
- 支援檔案建立、編輯、刪除
- 檔案樹狀結構顯示
- 多檔案專案管理

### 智能聊天介面
- WebSocket 即時通訊
- 串流式 AI 回應
- 聊天歷史記錄
- 上下文感知對話

## 🔧 開發指南

### 新增組件

1. 在 `src/components/[類別]/` 下建立組件
2. 使用 Vue 3 Composition API 和 `<script setup>` 語法
3. 在相鄰的 `__tests__/` 目錄中新增測試
4. 遵循 Vue 3 最佳實踐

範例組件結構：
```vue
<template>
  <div class="component-wrapper">
    <!-- 模板內容 -->
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

// 組件邏輯
const count = ref(0)
const doubleCount = computed(() => count.value * 2)
</script>

<style scoped>
/* 組件樣式 */
</style>
```

### API 開發

1. 在 `server/routes/` 中定義路由
2. 使用 Express.js 中介軟體
3. 遵循 RESTful API 設計原則
4. 新增對應的測試檔案

### 狀態管理

使用 Pinia 進行狀態管理：

```typescript
// stores/example.ts
export const useExampleStore = defineStore('example', () => {
  const state = ref(initialState)
  
  const actions = {
    updateState: (newState: State) => {
      state.value = newState
    }
  }
  
  return {
    state: readonly(state),
    ...actions
  }
})
```

## 🧪 測試

專案使用 Vitest 和 Vue Test Utils 進行測試：

```bash
# 執行所有測試
npm run test

# 執行特定測試檔案
npm test ChatInterface

# 監視模式
npm run test:watch
```

## 🌐 MCP 整合

專案整合了 Model Context Protocol (MCP) 伺服器：

- **serena**: IDE 助手功能
- **context7**: 文件存取功能  
- **fetch**: 網頁內容擷取
- **sequential-thinking**: 進階推理支援
- **time**: 時區處理 (預設 Asia/Taipei)

配置檔案位於 `.mcp.json`。

## 🚢 部署

### 生產建置

```bash
# 建置前端
npm run build

# 建置後端  
npm run build:backend
```

### Docker 部署

```bash
# 建置 Docker 映像
docker build -t uigen-vue .

# 執行容器
docker run -p 3001:3001 -p 5173:5173 uigen-vue
```

## 🤝 貢獻指南

1. Fork 專案
2. 建立功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交變更 (`git commit -m 'Add amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 開啟 Pull Request

### 開發流程

1. 每次修改後執行 `npm run build` 確保沒有問題
2. 先設計程式介面，接著開發測試程式碼
3. 完成功能後執行測試確保品質
4. 每個任務完成後進行 git commit

## 📄 授權

本專案採用 MIT 授權條款 - 詳見 [LICENSE](LICENSE) 檔案。

## 🙋‍♂️ 支援

如有問題或建議，請：

1. 查看 [Issues](../../issues) 頁面
2. 建立新的 Issue
3. 參考 [CLAUDE.md](CLAUDE.md) 開發文件

---

**UIGen Vue** - 讓 AI 協助你快速建立美麗的 Vue 組件 🚀

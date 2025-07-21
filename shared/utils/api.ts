import { API_VERSION, API_HEADERS } from '@shared/constants/api'

/**
 * 建構 API URL
 * @param endpoint API 端點
 * @param version API 版本，預設為當前版本
 * @param baseUrl 基礎 URL，預設從環境變數取得
 */
export function buildApiUrl(
  endpoint: string,
  version: string = API_VERSION.CURRENT,
  baseUrl: string = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'
): string {
  // 移除端點開頭的斜線（如果有的話）
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint
  
  return `${baseUrl}/api/${version}/${cleanEndpoint}`
}

/**
 * 建構 API 標頭
 * @param additionalHeaders 額外的標頭
 */
export function buildApiHeaders(additionalHeaders: Record<string, string> = {}): Record<string, string> {
  return {
    [API_HEADERS.CONTENT_TYPE]: 'application/json',
    [API_HEADERS.API_VERSION]: API_VERSION.CURRENT,
    [API_HEADERS.REQUEST_ID]: generateRequestId(),
    ...additionalHeaders,
  }
}

/**
 * 生成請求 ID
 */
export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * 替換 URL 參數
 * @param url 包含參數的 URL
 * @param params 參數對象
 */
export function replaceUrlParams(url: string, params: Record<string, string | number>): string {
  let result = url
  
  Object.entries(params).forEach(([key, value]) => {
    result = result.replace(`:${key}`, String(value))
  })
  
  return result
}

/**
 * 檢查 API 回應是否成功
 * @param status HTTP 狀態碼
 */
export function isApiSuccess(status: number): boolean {
  return status >= 200 && status < 300
}

/**
 * 格式化 API 錯誤訊息
 * @param error 錯誤對象
 */
export function formatApiError(error: any): string {
  if (error.response?.data?.message) {
    return error.response.data.message
  }
  
  if (error.message) {
    return error.message
  }
  
  return '發生未知錯誤，請稍後再試'
}
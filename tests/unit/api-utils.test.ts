import { describe, it, expect } from 'vitest'
import { buildApiUrl, buildApiHeaders, replaceUrlParams, isApiSuccess, formatApiError } from '@shared/utils/api'
import { API_VERSION } from '@shared/constants/api'

describe('API Utils', () => {
  describe('buildApiUrl', () => {
    it('should build correct API URL with default version', () => {
      const url = buildApiUrl('/users', undefined, 'http://localhost:3001')
      expect(url).toBe(`http://localhost:3001/api/${API_VERSION.CURRENT}/users`)
    })

    it('should build correct API URL with custom version', () => {
      const url = buildApiUrl('/users', 'v2', 'http://localhost:3001')
      expect(url).toBe('http://localhost:3001/api/v2/users')
    })

    it('should handle endpoint with leading slash', () => {
      const url = buildApiUrl('/users', 'v1', 'http://localhost:3001')
      expect(url).toBe('http://localhost:3001/api/v1/users')
    })
  })

  describe('buildApiHeaders', () => {
    it('should build headers with default values', () => {
      const headers = buildApiHeaders()
      expect(headers['Content-Type']).toBe('application/json')
      expect(headers['X-API-Version']).toBe(API_VERSION.CURRENT)
      expect(headers['X-Request-ID']).toMatch(/^req_\d+_[a-z0-9]+$/)
    })

    it('should merge additional headers', () => {
      const headers = buildApiHeaders({ 'Authorization': 'Bearer token' })
      expect(headers['Authorization']).toBe('Bearer token')
      expect(headers['Content-Type']).toBe('application/json')
    })
  })

  describe('replaceUrlParams', () => {
    it('should replace URL parameters', () => {
      const url = replaceUrlParams('/projects/:projectId/files/:fileId', {
        projectId: '123',
        fileId: '456'
      })
      expect(url).toBe('/projects/123/files/456')
    })

    it('should handle numeric parameters', () => {
      const url = replaceUrlParams('/users/:id', { id: 123 })
      expect(url).toBe('/users/123')
    })
  })

  describe('isApiSuccess', () => {
    it('should return true for success status codes', () => {
      expect(isApiSuccess(200)).toBe(true)
      expect(isApiSuccess(201)).toBe(true)
      expect(isApiSuccess(299)).toBe(true)
    })

    it('should return false for error status codes', () => {
      expect(isApiSuccess(400)).toBe(false)
      expect(isApiSuccess(404)).toBe(false)
      expect(isApiSuccess(500)).toBe(false)
    })
  })

  describe('formatApiError', () => {
    it('should format error with response message', () => {
      const error = {
        response: {
          data: {
            message: 'Custom error message'
          }
        }
      }
      expect(formatApiError(error)).toBe('Custom error message')
    })

    it('should format error with message property', () => {
      const error = { message: 'Error message' }
      expect(formatApiError(error)).toBe('Error message')
    })

    it('should return default message for unknown error', () => {
      const error = {}
      expect(formatApiError(error)).toBe('發生未知錯誤，請稍後再試')
    })
  })
})
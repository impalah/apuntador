/**
 * mTLS HTTP Adapter
 * 
 * Provides HTTP client that uses mTLS for backend communication
 * on Android, and regular fetch on web.
 */

import { Capacitor } from '@capacitor/core'
import MTLSClient from '@/plugins/mtlsClient'
import { BACKEND_OAUTH_URL } from '@/config/api'

export interface HttpRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  headers?: Record<string, string>
  body?: string | object
  timeout?: number
}

export interface HttpResponse<T = any> {
  status: number
  data: T
  headers?: Record<string, string>
}

export class MTLSHttpAdapter {
  private baseUrl: string

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/$/, '') // Remove trailing slash
  }

  /**
   * Make HTTP request using mTLS on Android, fetch on web
   */
  async request<T = any>(
    endpoint: string,
    options: HttpRequestOptions = {}
  ): Promise<HttpResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`
    const platform = Capacitor.getPlatform()

    // Prepare headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers,
    }

    // Prepare body
    let body: string | undefined
    if (options.body) {
      body = typeof options.body === 'string' 
        ? options.body 
        : JSON.stringify(options.body)
    }

    try {
      if (platform === 'android') {
        // Use mTLS client on Android
        console.log(`📱 mTLS Request: ${options.method || 'GET'} ${url}`)
        
        const result = await this.makeAndroidRequest(url, {
          method: options.method || 'GET',
          headers,
          body,
        })

        return result

      } else {
        // Use regular fetch on web
        console.log(`🌐 Fetch Request: ${options.method || 'GET'} ${url}`)
        
        const response = await fetch(url, {
          method: options.method || 'GET',
          headers,
          body,
        })

        const data = await response.json()

        return {
          status: response.status,
          data: data as T,
        }
      }
    } catch (error: any) {
      console.error(`HTTP Request Error (${url}):`, error)
      throw new Error(`Request failed: ${error.message}`)
    }
  }

  /**
   * Make request using Android mTLS client
   */
  private async makeAndroidRequest<T = any>(
    url: string,
    options: {
      method: string
      headers: Record<string, string>
      body?: string
    }
  ): Promise<HttpResponse<T>> {
    try {
      let result: { data: string; statusCode: number }

      switch (options.method) {
        case 'GET':
          result = await MTLSClient.get({ url })
          break

        case 'POST':
          result = await MTLSClient.post({
            url,
            body: options.body || '',
          })
          break

        case 'PUT':
          result = await MTLSClient.put({
            url,
            body: options.body || '',
          })
          break

        case 'DELETE':
          result = await MTLSClient.delete({ url })
          break

        default:
          throw new Error(`Unsupported method: ${options.method}`)
      }

      // Parse JSON response
      let data: T
      try {
        data = JSON.parse(result.data) as T
      } catch {
        // If not JSON, return as string
        data = result.data as any
      }

      return {
        status: result.statusCode,
        data,
      }

    } catch (error: any) {
      console.error('Android mTLS request error:', error)
      throw error
    }
  }

  /**
   * Convenience methods
   */
  async get<T = any>(endpoint: string, headers?: Record<string, string>): Promise<HttpResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET', headers })
  }

  async post<T = any>(
    endpoint: string,
    body?: object | string,
    headers?: Record<string, string>
  ): Promise<HttpResponse<T>> {
    return this.request<T>(endpoint, { method: 'POST', body, headers })
  }

  async put<T = any>(
    endpoint: string,
    body?: object | string,
    headers?: Record<string, string>
  ): Promise<HttpResponse<T>> {
    return this.request<T>(endpoint, { method: 'PUT', body, headers })
  }

  async delete<T = any>(endpoint: string, headers?: Record<string, string>): Promise<HttpResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE', headers })
  }
}

/**
 * Create HTTP client for backend communication
 */
export function createBackendClient(baseUrl?: string): MTLSHttpAdapter {
  const url = 
    baseUrl || 
    import.meta.env.VITE_BACKEND_URL || 
    import.meta.env.VITE_BACKEND_OAUTH_URL_DEV ||
    import.meta.env.VITE_BACKEND_OAUTH_URL_PROD ||
    BACKEND_OAUTH_URL
  return new MTLSHttpAdapter(url)
}

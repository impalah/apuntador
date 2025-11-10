import { WebPlugin } from '@capacitor/core'
import type { MTLSClientPlugin } from './index'

export class MTLSClientWeb extends WebPlugin implements MTLSClientPlugin {
  async isReady(): Promise<{ isReady: boolean }> {
    console.warn('mTLS is not available on web platform')
    return { isReady: false }
  }

  async get(): Promise<{ data: string; statusCode: number }> {
    throw this.unavailable('mTLS is not available on web platform')
  }

  async post(): Promise<{ data: string; statusCode: number }> {
    throw this.unavailable('mTLS is not available on web platform')
  }

  async put(): Promise<{ data: string; statusCode: number }> {
    throw this.unavailable('mTLS is not available on web platform')
  }

  async delete(): Promise<{ data: string; statusCode: number }> {
    throw this.unavailable('mTLS is not available on web platform')
  }

  async startRenewalService(): Promise<{ success: boolean }> {
    throw this.unavailable('mTLS is not available on web platform')
  }

  async stopRenewalService(): Promise<{ success: boolean }> {
    throw this.unavailable('mTLS is not available on web platform')
  }

  async reset(): Promise<{ success: boolean }> {
    throw this.unavailable('mTLS is not available on web platform')
  }
}

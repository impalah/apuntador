/**
 * Cloud Provider Configuration Service
 *
 * Fetches and caches cloud provider configuration from backend.
 * Determines which providers are enabled and their requirements.
 */

import { Capacitor } from '@capacitor/core'
import { isTauri } from '@/utils/tauri'

/**
 * Provider configuration from backend
 */
export interface ProviderInfo {
  enabled: boolean
  requiresMtls: boolean
}

/**
 * Backend configuration response
 */
export interface CloudProviderConfig {
  providers: Record<string, ProviderInfo>
  version: string
  cacheTtl: number
}

/**
 * Cached configuration with expiration
 */
interface CachedConfig {
  config: CloudProviderConfig
  expiresAt: number
}

const STORAGE_KEY = 'cloud_provider_config'
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://api.apuntador.io'
const API_KEY = import.meta.env.VITE_BACKEND_API_KEY || import.meta.env.VITE_SECRET_KEY || ''

/**
 * Cloud Provider Configuration Service
 */
export class CloudProviderConfigService {
  private static instance: CloudProviderConfigService | null = null
  private memoryCache: CachedConfig | null = null

  private constructor() {}

  /**
   * Get singleton instance
   */
  static getInstance(): CloudProviderConfigService {
    this.instance ??= new CloudProviderConfigService()
    return this.instance
  }

  /**
   * Fetch provider configuration from backend
   */
  async fetchConfig(): Promise<CloudProviderConfig> {
    console.log('[SEARCH] [CloudProviderConfig] Fetching provider configuration from backend...')
    console.log('   Backend URL:', BACKEND_URL)
    console.log('   API Key configured:', API_KEY ? 'Yes' : 'No')

    const url = `${BACKEND_URL}/config/providers`
    const headers = {
      Authorization: `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
    }

    console.log('[WEB] [CloudProviderConfig] Using direct fetch (bypassing adapter)')
    console.log('   URL:', url)
    console.log('   Headers:', {
      ...headers,
      Authorization: `Bearer ${API_KEY.substring(0, 10)}...`,
    })

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers,
      })

      console.log('[SIGNAL] [CloudProviderConfig] Response received:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
      })

      if (!response.ok) {
        const errorBody = await response.text()
        console.error('[ERROR] [CloudProviderConfig] HTTP Error:', {
          status: response.status,
          statusText: response.statusText,
          body: errorBody,
        })

        if (response.status === 401) {
          throw new Error(`Unauthorized: Invalid or missing API key (${response.status})`)
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const config: CloudProviderConfig = await response.json()

      console.log('[OK] [CloudProviderConfig] Configuration fetched successfully')
      console.log(
        '   Enabled providers:',
        Object.keys(config.providers).filter((p) => config.providers[p]?.enabled)
      )
      console.log('   Backend version:', config.version)
      console.log('   Cache TTL:', config.cacheTtl, 'seconds')

      // Store in cache
      this.saveToCache(config)

      return config
    } catch (error: any) {
      console.error('[ERROR] [CloudProviderConfig] Failed to fetch configuration')
      console.error('   Backend URL:', BACKEND_URL)
      console.error('   API Key:', API_KEY ? `${API_KEY.substring(0, 10)}...` : 'NOT SET')
      console.error('   Error type:', typeof error)
      console.error('   Error name:', error?.name)
      console.error('   Error message:', error?.message)
      console.error('   Error toString:', String(error))
      console.error('   Error instanceof Error:', error instanceof Error)
      console.error('   Error instanceof TypeError:', error instanceof TypeError)
      console.error('   Full error object:', error)

      // Try to return cached config even if expired (better than nothing)
      const cached = this.loadFromCache(true)
      if (cached) {
        console.warn('[WARNING]  Using expired cached configuration as fallback')
        return cached
      }

      throw error
    }
  }

  /**
   * Get cached configuration (fetch if not cached or expired)
   */
  async getConfig(): Promise<CloudProviderConfig> {
    // Check memory cache first
    if (this.memoryCache && this.memoryCache.expiresAt > Date.now()) {
      console.log('[PACKAGE] [CloudProviderConfig] Using memory cache')
      return this.memoryCache.config
    }

    // Check localStorage cache
    const cached = this.loadFromCache()
    if (cached) {
      console.log('[SAVE] [CloudProviderConfig] Using localStorage cache')
      this.memoryCache = {
        config: cached,
        expiresAt: Date.now() + cached.cacheTtl * 1000,
      }
      return cached
    }

    // Fetch from backend
    console.log('[WEB] [CloudProviderConfig] No valid cache, fetching from backend...')
    return await this.fetchConfig()
  }

  /**
   * Check if a specific provider is enabled
   */
  async isProviderEnabled(providerId: string): Promise<boolean> {
    try {
      const config = await this.getConfig()
      const provider = config.providers[providerId.toLowerCase()]
      return provider ? provider.enabled : false
    } catch (error) {
      console.error(`[ERROR] Failed to check if provider ${providerId} is enabled:`, error)
      // Default to enabled on error (fail open)
      return true
    }
  }

  /**
   * Get list of enabled provider IDs
   */
  async getEnabledProviders(): Promise<string[]> {
    try {
      const config = await this.getConfig()
      return Object.keys(config.providers).filter(
        (providerId) => config.providers[providerId]?.enabled
      )
    } catch (error) {
      console.error('[ERROR] Failed to get enabled providers:', error)
      // Default to all known providers on error
      return ['googledrive', 'dropbox']
    }
  }

  /**
   * Clear cache (force refresh on next request)
   */
  clearCache(): void {
    console.log('[DELETE]  [CloudProviderConfig] Clearing cache')
    this.memoryCache = null
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch (error) {
      console.warn('Failed to clear localStorage cache:', error)
    }
  }

  /**
   * Save configuration to cache
   */
  private saveToCache(config: CloudProviderConfig): void {
    const expiresAt = Date.now() + config.cacheTtl * 1000

    // Save to memory
    this.memoryCache = { config, expiresAt }

    // Save to localStorage
    try {
      const cached: CachedConfig = { config, expiresAt }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cached))
      console.log(
        '[SAVE] [CloudProviderConfig] Saved to cache (expires in',
        config.cacheTtl,
        'seconds)'
      )
    } catch (error) {
      console.warn('Failed to save to localStorage:', error)
    }
  }

  /**
   * Load configuration from cache
   */
  private loadFromCache(ignoreExpiration = false): CloudProviderConfig | null {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (!stored) {
        return null
      }

      const cached: CachedConfig = JSON.parse(stored)

      // Check expiration
      if (!ignoreExpiration && cached.expiresAt <= Date.now()) {
        console.log('[TIME] [CloudProviderConfig] Cache expired')
        return null
      }

      return cached.config
    } catch (error) {
      console.warn('Failed to load from localStorage:', error)
      return null
    }
  }

  /**
   * Get platform identifier
   */
  getPlatform(): string {
    if (isTauri()) return 'desktop'
    return Capacitor.getPlatform()
  }
}

/**
 * Global instance for easy access
 */
export const cloudProviderConfig = CloudProviderConfigService.getInstance()

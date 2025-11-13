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
    if (!this.instance) {
      this.instance = new CloudProviderConfigService()
    }
    return this.instance
  }

  /**
   * Fetch provider configuration from backend
   */
  async fetchConfig(): Promise<CloudProviderConfig> {
    console.log('🔍 [CloudProviderConfig] Fetching provider configuration from backend...')

    try {
    const response = await fetch(`${BACKEND_URL}/config/providers`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
    })
    
    if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Invalid API key for configuration endpoint')
        }
        throw new Error(`Failed to fetch config: ${response.status} ${response.statusText}`)
      }

      const config: CloudProviderConfig = await response.json()

      console.log('✅ [CloudProviderConfig] Configuration fetched successfully')
      console.log('   Enabled providers:', Object.keys(config.providers).filter(p => config.providers[p].enabled))
      console.log('   Backend version:', config.version)
      console.log('   Cache TTL:', config.cacheTtl, 'seconds')

      // Store in cache
      this.saveToCache(config)

      return config
    } catch (error: any) {
      console.error('❌ [CloudProviderConfig] Failed to fetch configuration:', error)
      
      // Try to return cached config even if expired (better than nothing)
      const cached = this.loadFromCache(true)
      if (cached) {
        console.warn('⚠️  Using expired cached configuration as fallback')
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
      console.log('📦 [CloudProviderConfig] Using memory cache')
      return this.memoryCache.config
    }

    // Check localStorage cache
    const cached = this.loadFromCache()
    if (cached) {
      console.log('💾 [CloudProviderConfig] Using localStorage cache')
      this.memoryCache = {
        config: cached,
        expiresAt: Date.now() + (cached.cacheTtl * 1000),
      }
      return cached
    }

    // Fetch from backend
    console.log('🌐 [CloudProviderConfig] No valid cache, fetching from backend...')
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
      console.error(`❌ Failed to check if provider ${providerId} is enabled:`, error)
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
        providerId => config.providers[providerId].enabled
      )
    } catch (error) {
      console.error('❌ Failed to get enabled providers:', error)
      // Default to all known providers on error
      return ['googledrive', 'dropbox']
    }
  }

  /**
   * Clear cache (force refresh on next request)
   */
  clearCache(): void {
    console.log('🗑️  [CloudProviderConfig] Clearing cache')
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
    const expiresAt = Date.now() + (config.cacheTtl * 1000)

    // Save to memory
    this.memoryCache = { config, expiresAt }

    // Save to localStorage
    try {
      const cached: CachedConfig = { config, expiresAt }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cached))
      console.log('💾 [CloudProviderConfig] Saved to cache (expires in', config.cacheTtl, 'seconds)')
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
        console.log('⏰ [CloudProviderConfig] Cache expired')
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

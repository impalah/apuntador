/**
 * Tests for Cloud Provider Configuration Service
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  CloudProviderConfigService,
  cloudProviderConfig,
  type CloudProviderConfig,
} from '@/services/cloudProviderConfig'

// Mock dependencies
vi.mock('@capacitor/core', () => ({
  Capacitor: {
    getPlatform: () => 'web',
  },
}))

vi.mock('@/utils/tauri', () => ({
  isTauri: () => false,
}))

describe('CloudProviderConfigService', () => {
  let service: CloudProviderConfigService
  let fetchMock: ReturnType<typeof vi.fn>

  const mockConfig: CloudProviderConfig = {
    providers: {
      googledrive: { enabled: true, requiresMtls: false },
      dropbox: { enabled: true, requiresMtls: false },
      onedrive: { enabled: false, requiresMtls: false },
    },
    version: '1.0.0',
    cacheTtl: 3600,
  }

  beforeEach(() => {
    // Reset singleton instance
    CloudProviderConfigService['instance'] = null
    service = CloudProviderConfigService.getInstance()

    // Clear localStorage
    localStorage.clear()

    // Mock fetch
    fetchMock = vi.fn()
    globalThis.fetch = fetchMock as any
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('singleton pattern', () => {
    it('should return same instance on multiple calls', () => {
      const instance1 = CloudProviderConfigService.getInstance()
      const instance2 = CloudProviderConfigService.getInstance()

      expect(instance1).toBe(instance2)
    })

    it('should provide global instance', () => {
      expect(cloudProviderConfig).toBeInstanceOf(CloudProviderConfigService)
    })
  })

  describe('fetchConfig', () => {
    it('should fetch configuration from backend', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockConfig,
      })

      const config = await service.fetchConfig()

      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/config/providers'),
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      )

      expect(config).toEqual(mockConfig)
    })

    it('should throw error on 401 unauthorized', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        text: async () => 'Unauthorized',
      })

      await expect(service.fetchConfig()).rejects.toThrow('Unauthorized: Invalid or missing API key')
    })

    it('should throw error on other HTTP errors', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        text: async () => 'Internal Server Error',
      })

      await expect(service.fetchConfig()).rejects.toThrow('HTTP 500: Internal Server Error')
    })

    it('should save fetched config to cache', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockConfig,
      })

      await service.fetchConfig()

      const cached = localStorage.getItem('cloud_provider_config')
      expect(cached).toBeTruthy()

      const parsed = JSON.parse(cached!)
      expect(parsed.config).toEqual(mockConfig)
    })

    it('should use expired cache as fallback on fetch error', async () => {
      // First save an expired config to cache
      const expiredConfig = { ...mockConfig, version: '0.9.0' }
      const expiredCache = {
        config: expiredConfig,
        expiresAt: Date.now() - 1000, // Expired 1 second ago
      }
      localStorage.setItem('cloud_provider_config', JSON.stringify(expiredCache))

      // Mock fetch to fail
      fetchMock.mockRejectedValueOnce(new Error('Network error'))

      const config = await service.fetchConfig()

      expect(config).toEqual(expiredConfig)
    })

    it('should throw error if fetch fails and no cache available', async () => {
      fetchMock.mockRejectedValueOnce(new Error('Network error'))

      await expect(service.fetchConfig()).rejects.toThrow('Network error')
    })
  })

  describe('getConfig', () => {
    it('should return cached config if not expired', async () => {
      // Save valid cache
      const cachedData = {
        config: mockConfig,
        expiresAt: Date.now() + 10000, // Expires in 10 seconds
      }
      localStorage.setItem('cloud_provider_config', JSON.stringify(cachedData))

      const config = await service.getConfig()

      expect(config).toEqual(mockConfig)
      expect(fetchMock).not.toHaveBeenCalled()
    })

    it('should fetch if cache is expired', async () => {
      // Save expired cache
      const expiredCache = {
        config: mockConfig,
        expiresAt: Date.now() - 1000, // Expired
      }
      localStorage.setItem('cloud_provider_config', JSON.stringify(expiredCache))

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockConfig,
      })

      const config = await service.getConfig()

      expect(config).toEqual(mockConfig)
      expect(fetchMock).toHaveBeenCalled()
    })

    it('should fetch if no cache exists', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockConfig,
      })

      const config = await service.getConfig()

      expect(config).toEqual(mockConfig)
      expect(fetchMock).toHaveBeenCalled()
    })

    it('should use memory cache on subsequent calls', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockConfig,
      })

      // First call - fetches
      await service.getConfig()

      // Second call - should use memory cache
      const config = await service.getConfig()

      expect(config).toEqual(mockConfig)
      expect(fetchMock).toHaveBeenCalledTimes(1) // Only called once
    })
  })

  describe('isProviderEnabled', () => {
    beforeEach(() => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => mockConfig,
      })
    })

    it('should return true for enabled provider', async () => {
      const enabled = await service.isProviderEnabled('googledrive')

      expect(enabled).toBe(true)
    })

    it('should return false for disabled provider', async () => {
      const enabled = await service.isProviderEnabled('onedrive')

      expect(enabled).toBe(false)
    })

    it('should return false for non-existent provider', async () => {
      const enabled = await service.isProviderEnabled('unknown')

      expect(enabled).toBe(false)
    })

    it('should be case-insensitive', async () => {
      const enabled1 = await service.isProviderEnabled('GoogleDrive')
      const enabled2 = await service.isProviderEnabled('DROPBOX')

      expect(enabled1).toBe(true)
      expect(enabled2).toBe(true)
    })

    it('should default to true on error (fail open)', async () => {
      fetchMock.mockRejectedValueOnce(new Error('Network error'))

      const enabled = await service.isProviderEnabled('googledrive')

      expect(enabled).toBe(true)
    })
  })

  describe('getEnabledProviders', () => {
    beforeEach(() => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => mockConfig,
      })
    })

    it('should return list of enabled provider IDs', async () => {
      const providers = await service.getEnabledProviders()

      expect(providers).toEqual(['googledrive', 'dropbox'])
    })

    it('should return default providers on error', async () => {
      fetchMock.mockRejectedValueOnce(new Error('Network error'))

      const providers = await service.getEnabledProviders()

      expect(providers).toEqual(['googledrive', 'dropbox'])
    })
  })

  describe('clearCache', () => {
    it('should clear memory and localStorage cache', async () => {
      // First fetch to populate cache
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockConfig,
      })

      await service.getConfig()
      expect(localStorage.getItem('cloud_provider_config')).toBeTruthy()

      // Clear cache
      service.clearCache()

      expect(localStorage.getItem('cloud_provider_config')).toBeNull()

      // Next call should fetch again
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockConfig,
      })

      await service.getConfig()

      expect(fetchMock).toHaveBeenCalledTimes(2)
    })
  })

  describe('getPlatform', () => {
    it('should return platform from Capacitor', () => {
      const platform = service.getPlatform()

      expect(platform).toBe('web')
    })
  })

  describe('cache expiration', () => {
    it('should respect cache TTL from backend', async () => {
      const shortTtlConfig = { ...mockConfig, cacheTtl: 1 } // 1 second

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => shortTtlConfig,
      })

      // First fetch
      await service.getConfig()

      // Should use cache immediately
      await service.getConfig()
      expect(fetchMock).toHaveBeenCalledTimes(1)

      // Wait for cache to expire
      await new Promise(resolve => setTimeout(resolve, 1100))

      // Should fetch again after expiration
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockConfig,
      })

      await service.getConfig()
      expect(fetchMock).toHaveBeenCalledTimes(2)
    })
  })
})

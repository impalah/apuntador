import localforage from 'localforage'
import { STORAGE_KEYS } from './constants'

/**
 * Storage abstraction layer using localforage with localStorage fallback
 */
class StorageService {
  private readonly store: typeof localforage

  constructor() {
    this.store = localforage.createInstance({
      name: 'Apuntador',
      version: 1,
      storeName: 'apuntador_data',
      description: 'Apuntador teleprompter data',
    })
  }

  /**
   * Get value from storage
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      // Try localforage first
      const result = await this.store.getItem<T>(key)
      if (result !== null) {
        return result
      }
      // If null, also try fallback
      return this.fallbackGet<T>(key)
    } catch (error) {
      console.warn('Storage get error:', error)
      return this.fallbackGet<T>(key)
    }
  }

  /**
   * Set value in storage
   */
  async set<T>(key: string, value: T): Promise<void> {
    try {
      // Use JSON serialization to avoid Pinia 3 metadata issues
      // Parse and stringify to create a clean copy without internal references
      const cleanValue = JSON.parse(JSON.stringify(value))
      await this.store.setItem(key, cleanValue)
      // Also save to localStorage as backup
      this.fallbackSet(key, value)
    } catch (error) {
      console.warn('Storage set error:', error)
      this.fallbackSet(key, value)
    }
  }

  /**
   * Remove value from storage
   */
  async remove(key: string): Promise<void> {
    try {
      await this.store.removeItem(key)
    } catch (error) {
      console.warn('Storage remove error:', error)
      this.fallbackRemove(key)
    }
  }

  /**
   * Clear all storage
   */
  async clear(): Promise<void> {
    try {
      await this.store.clear()
    } catch (error) {
      console.warn('Storage clear error:', error)
      this.fallbackClear()
    }
  }

  /**
   * Get all keys
   */
  async keys(): Promise<string[]> {
    try {
      return await this.store.keys()
    } catch (error) {
      console.warn('Storage keys error:', error)
      return this.fallbackKeys()
    }
  }

  /**
   * Fallback to localStorage
   */
  private fallbackGet<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : null
    } catch {
      return null
    }
  }

  private fallbackSet<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch (error) {
      console.error('LocalStorage set error:', error)
    }
  }

  private fallbackRemove(key: string): void {
    try {
      localStorage.removeItem(key)
    } catch (error) {
      console.error('LocalStorage remove error:', error)
    }
  }

  private fallbackClear(): void {
    try {
      // Only clear Apuntador keys
      const keys = Object.values(STORAGE_KEYS)
      keys.forEach((key) => localStorage.removeItem(key))
    } catch (error) {
      console.error('LocalStorage clear error:', error)
    }
  }

  private fallbackKeys(): string[] {
    try {
      return Object.keys(localStorage).filter((key) =>
        Object.values(STORAGE_KEYS).includes(key as any)
      )
    } catch {
      return []
    }
  }
}

// Export singleton instance
export const storage = new StorageService()

/**
 * Type-safe storage helpers for specific data types
 */
export const contentStorage = {
  async get() {
    return storage.get<string>(STORAGE_KEYS.CONTENT)
  },
  async set(content: string) {
    return storage.set(STORAGE_KEYS.CONTENT, content)
  },
}

export const scrollPositionStorage = {
  async get() {
    return storage.get<number>(STORAGE_KEYS.SCROLL_POSITION)
  },
  async set(position: number) {
    return storage.set(STORAGE_KEYS.SCROLL_POSITION, position)
  },
}

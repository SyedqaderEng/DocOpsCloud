// Redis Cache Service

export interface CacheOptions {
  ttl?: number // Time to live in seconds
  tags?: string[] // Cache tags for group invalidation
}

export interface CacheStats {
  hits: number
  misses: number
  hitRate: number
  size: number
  keys: number
}

class RedisCache {
  private enabled: boolean
  private stats = {
    hits: 0,
    misses: 0,
  }

  constructor() {
    this.enabled = process.env.REDIS_URL !== undefined
  }

  /**
   * Get value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    if (!this.enabled) return null

    try {
      // In production, use actual Redis client
      // For now, using in-memory cache simulation
      const cached = global._cache?.get(key)

      if (cached) {
        this.stats.hits++
        return JSON.parse(cached)
      }

      this.stats.misses++
      return null
    } catch (error) {
      console.error('Cache get error:', error)
      return null
    }
  }

  /**
   * Set value in cache
   */
  async set(key: string, value: any, options?: CacheOptions): Promise<void> {
    if (!this.enabled) return

    try {
      global._cache = global._cache || new Map()
      global._cache.set(key, JSON.stringify(value))

      // Set expiry if TTL provided
      if (options?.ttl) {
        setTimeout(() => {
          global._cache?.delete(key)
        }, options.ttl * 1000)
      }
    } catch (error) {
      console.error('Cache set error:', error)
    }
  }

  /**
   * Delete key from cache
   */
  async delete(key: string): Promise<void> {
    if (!this.enabled) return

    try {
      global._cache?.delete(key)
    } catch (error) {
      console.error('Cache delete error:', error)
    }
  }

  /**
   * Delete multiple keys matching pattern
   */
  async deletePattern(pattern: string): Promise<number> {
    if (!this.enabled) return 0

    try {
      let deleted = 0
      const regex = new RegExp(pattern.replace('*', '.*'))

      global._cache?.forEach((_, key) => {
        if (regex.test(key)) {
          global._cache?.delete(key)
          deleted++
        }
      })

      return deleted
    } catch (error) {
      console.error('Cache delete pattern error:', error)
      return 0
    }
  }

  /**
   * Clear entire cache
   */
  async clear(): Promise<void> {
    if (!this.enabled) return

    try {
      global._cache?.clear()
    } catch (error) {
      console.error('Cache clear error:', error)
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    const total = this.stats.hits + this.stats.misses
    const hitRate = total > 0 ? this.stats.hits / total : 0

    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      hitRate: Math.round(hitRate * 10000) / 100,
      size: global._cache?.size || 0,
      keys: global._cache?.size || 0,
    }
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.stats.hits = 0
    this.stats.misses = 0
  }

  /**
   * Wrap function with caching
   */
  async wrap<T>(
    key: string,
    fn: () => Promise<T>,
    options?: CacheOptions
  ): Promise<T> {
    // Try to get from cache
    const cached = await this.get<T>(key)
    if (cached !== null) {
      return cached
    }

    // Execute function and cache result
    const result = await fn()
    await this.set(key, result, options)
    return result
  }

  /**
   * Cache with automatic key generation
   */
  async memoize<T>(
    namespace: string,
    params: any,
    fn: () => Promise<T>,
    options?: CacheOptions
  ): Promise<T> {
    const key = this.generateKey(namespace, params)
    return this.wrap(key, fn, options)
  }

  /**
   * Generate cache key from parameters
   */
  private generateKey(namespace: string, params: any): string {
    const paramsStr = JSON.stringify(params)
    return `${namespace}:${Buffer.from(paramsStr).toString('base64')}`
  }
}

// Global type augmentation
declare global {
  var _cache: Map<string, string> | undefined
}

export const cache = new RedisCache()

// Cache decorators
export function Cacheable(options?: CacheOptions) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value

    descriptor.value = async function (...args: any[]) {
      const cacheKey = `${target.constructor.name}:${propertyKey}:${JSON.stringify(args)}`

      return cache.wrap(
        cacheKey,
        () => originalMethod.apply(this, args),
        options
      )
    }

    return descriptor
  }
}

export function CacheEvict(pattern: string) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value

    descriptor.value = async function (...args: any[]) {
      const result = await originalMethod.apply(this, args)
      await cache.deletePattern(pattern)
      return result
    }

    return descriptor
  }
}

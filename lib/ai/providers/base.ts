// Base AI Provider Interface

export interface AIMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface AICompletionOptions {
  model?: string
  maxTokens?: number
  temperature?: number
  stream?: boolean
}

export interface AICompletionResult {
  content: string
  tokensUsed: {
    input: number
    output: number
    total: number
  }
  model: string
  finishReason: string
}

export interface AIEmbeddingResult {
  embeddings: number[][]
  tokensUsed: number
  model: string
}

export interface AIVisionOptions extends AICompletionOptions {
  imageUrl?: string
  imageBase64?: string
}

export abstract class BaseAIProvider {
  protected apiKey: string
  protected baseUrl: string

  constructor(apiKey: string, baseUrl: string) {
    this.apiKey = apiKey
    this.baseUrl = baseUrl
  }

  abstract complete(messages: AIMessage[], options?: AICompletionOptions): Promise<AICompletionResult>
  abstract completeWithVision(prompt: string, options: AIVisionOptions): Promise<AICompletionResult>
  abstract embed(texts: string[]): Promise<AIEmbeddingResult>

  // Utility method to estimate tokens (rough approximation)
  protected estimateTokens(text: string): number {
    return Math.ceil(text.length / 4)
  }
}

// Rate limiter for AI calls
export class AIRateLimiter {
  private requests: Map<string, number[]> = new Map()
  private maxRequests: number
  private windowMs: number

  constructor(maxRequests = 100, windowMs = 60000) {
    this.maxRequests = maxRequests
    this.windowMs = windowMs
  }

  canMakeRequest(userId: string): boolean {
    const now = Date.now()
    const userRequests = this.requests.get(userId) || []
    const validRequests = userRequests.filter(time => now - time < this.windowMs)

    return validRequests.length < this.maxRequests
  }

  recordRequest(userId: string): void {
    const now = Date.now()
    const userRequests = this.requests.get(userId) || []
    userRequests.push(now)

    // Cleanup old requests
    const validRequests = userRequests.filter(time => now - time < this.windowMs)
    this.requests.set(userId, validRequests)
  }

  getRemainingRequests(userId: string): number {
    const now = Date.now()
    const userRequests = this.requests.get(userId) || []
    const validRequests = userRequests.filter(time => now - time < this.windowMs)

    return Math.max(0, this.maxRequests - validRequests.length)
  }
}

// Cache for AI responses
export class AICache {
  private cache: Map<string, { result: any; expiresAt: number }> = new Map()
  private defaultTTL: number

  constructor(defaultTTL = 3600000) { // 1 hour default
    this.defaultTTL = defaultTTL
  }

  get(key: string): any | null {
    const cached = this.cache.get(key)
    if (!cached) return null
    if (Date.now() > cached.expiresAt) {
      this.cache.delete(key)
      return null
    }
    return cached.result
  }

  set(key: string, result: any, ttl?: number): void {
    this.cache.set(key, {
      result,
      expiresAt: Date.now() + (ttl || this.defaultTTL),
    })
  }

  generateKey(operation: string, input: string): string {
    // Simple hash function
    let hash = 0
    const str = `${operation}:${input}`
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash
    }
    return `ai:${operation}:${hash.toString(16)}`
  }

  clear(): void {
    this.cache.clear()
  }
}

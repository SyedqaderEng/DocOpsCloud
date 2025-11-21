// API v2 Middleware

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { APIv2Response, APIErrorCodes } from './base'

interface RateLimitConfig {
  windowMs: number // Time window in milliseconds
  maxRequests: number // Max requests per window
}

// Rate limit storage (in production, use Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

export class APIv2Middleware {
  /**
   * Authenticate API request using API key
   */
  static async authenticateAPI(request: NextRequest): Promise<{
    valid: boolean
    userId?: string
    apiKeyId?: string
    error?: any
  }> {
    const apiKey = request.headers.get('X-API-Key') || request.headers.get('Authorization')?.replace('Bearer ', '')

    if (!apiKey) {
      return {
        valid: false,
        error: APIv2Response.error(
          APIErrorCodes.UNAUTHORIZED,
          'API key required',
          { hint: 'Provide API key in X-API-Key header or Authorization: Bearer {key}' },
          401
        ),
      }
    }

    // Hash the API key to look it up
    // In production, API keys should be hashed before storage
    const apiKeyRecord = await prisma.apiKey.findFirst({
      where: {
        key_preview: apiKey.substring(0, 8), // Use preview for lookup
        is_active: true,
      },
    })

    if (!apiKeyRecord) {
      return {
        valid: false,
        error: APIv2Response.error(
          APIErrorCodes.INVALID_API_KEY,
          'Invalid API key',
          null,
          401
        ),
      }
    }

    // Check if key is expired
    if (apiKeyRecord.expires_at && apiKeyRecord.expires_at < new Date()) {
      return {
        valid: false,
        error: APIv2Response.error(
          APIErrorCodes.API_KEY_EXPIRED,
          'API key expired',
          { expired_at: apiKeyRecord.expires_at },
          401
        ),
      }
    }

    // Update last used timestamp
    await prisma.apiKey.update({
      where: { id: apiKeyRecord.id },
      data: { last_used_at: new Date() },
    })

    return {
      valid: true,
      userId: apiKeyRecord.user_id,
      apiKeyId: apiKeyRecord.id,
    }
  }

  /**
   * Rate limiting middleware
   */
  static async checkRateLimit(
    identifier: string,
    config: RateLimitConfig = { windowMs: 60000, maxRequests: 100 }
  ): Promise<{
    allowed: boolean
    limit: number
    remaining: number
    reset: number
    error?: any
  }> {
    const now = Date.now()
    const stored = rateLimitStore.get(identifier)

    // Clean up if window has passed
    if (stored && now > stored.resetTime) {
      rateLimitStore.delete(identifier)
    }

    const current = rateLimitStore.get(identifier)

    if (!current) {
      // First request in this window
      rateLimitStore.set(identifier, {
        count: 1,
        resetTime: now + config.windowMs,
      })

      return {
        allowed: true,
        limit: config.maxRequests,
        remaining: config.maxRequests - 1,
        reset: now + config.windowMs,
      }
    }

    if (current.count >= config.maxRequests) {
      return {
        allowed: false,
        limit: config.maxRequests,
        remaining: 0,
        reset: current.resetTime,
        error: APIv2Response.error(
          APIErrorCodes.RATE_LIMIT_EXCEEDED,
          'Rate limit exceeded',
          {
            limit: config.maxRequests,
            reset_at: new Date(current.resetTime).toISOString(),
          },
          429
        ),
      }
    }

    // Increment count
    current.count++

    return {
      allowed: true,
      limit: config.maxRequests,
      remaining: config.maxRequests - current.count,
      reset: current.resetTime,
    }
  }

  /**
   * Validate request parameters
   */
  static validateParams(
    params: Record<string, any>,
    required: string[],
    optional: string[] = []
  ): {
    valid: boolean
    error?: any
  } {
    const missingParams = required.filter(param => !(param in params))

    if (missingParams.length > 0) {
      return {
        valid: false,
        error: APIv2Response.error(
          APIErrorCodes.MISSING_PARAMETER,
          'Missing required parameters',
          { missing: missingParams },
          400
        ),
      }
    }

    const allowedParams = [...required, ...optional]
    const invalidParams = Object.keys(params).filter(param => !allowedParams.includes(param))

    if (invalidParams.length > 0) {
      return {
        valid: false,
        error: APIv2Response.error(
          APIErrorCodes.INVALID_PARAMETER,
          'Invalid parameters provided',
          { invalid: invalidParams, allowed: allowedParams },
          400
        ),
      }
    }

    return { valid: true }
  }

  /**
   * Parse pagination params
   */
  static parsePaginationParams(searchParams: URLSearchParams): {
    page: number
    perPage: number
  } {
    const page = parseInt(searchParams.get('page') || '1', 10)
    const perPage = Math.min(
      parseInt(searchParams.get('per_page') || '25', 10),
      100 // Max per page
    )

    return {
      page: Math.max(1, page),
      perPage: Math.max(1, perPage),
    }
  }

  /**
   * Log API request
   */
  static async logAPIRequest(
    userId: string,
    endpoint: string,
    method: string,
    statusCode: number,
    responseTime: number
  ): Promise<void> {
    await prisma.auditLog.create({
      data: {
        user_id: userId,
        action: 'API_REQUEST',
        resource_type: 'API',
        resource_id: endpoint,
        metadata: {
          method,
          status_code: statusCode,
          response_time_ms: responseTime,
          timestamp: new Date().toISOString(),
        },
      },
    })
  }

  /**
   * Check user permissions
   */
  static async checkPermissions(
    userId: string,
    requiredPermissions: string[]
  ): Promise<{
    allowed: boolean
    error?: any
  }> {
    // In production, check user's role and permissions
    // For now, this is a placeholder

    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      return {
        allowed: false,
        error: APIv2Response.error(
          APIErrorCodes.UNAUTHORIZED,
          'User not found',
          null,
          401
        ),
      }
    }

    // Check subscription tier for API access
    if (user.subscription_tier === 'FREE' && requiredPermissions.includes('premium_api')) {
      return {
        allowed: false,
        error: APIv2Response.error(
          APIErrorCodes.INSUFFICIENT_PERMISSIONS,
          'Premium subscription required for this API endpoint',
          { required_tier: 'PRO' },
          403
        ),
      }
    }

    return { allowed: true }
  }

  /**
   * Handle CORS for API requests
   */
  static corsHeaders(origin?: string): Record<string, string> {
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['*']
    const allowOrigin = origin && allowedOrigins.includes(origin) ? origin : '*'

    return {
      'Access-Control-Allow-Origin': allowOrigin,
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
      'Access-Control-Max-Age': '86400',
    }
  }
}

// API v2 Base Framework

export interface APIResponse<T = any> {
  success: boolean
  data?: T
  error?: APIError
  meta?: APIMeta
}

export interface APIError {
  code: string
  message: string
  details?: any
  documentation_url?: string
}

export interface APIMeta {
  request_id: string
  timestamp: string
  version: string
  rate_limit?: RateLimitInfo
  pagination?: PaginationInfo
}

export interface RateLimitInfo {
  limit: number
  remaining: number
  reset: number // Unix timestamp
}

export interface PaginationInfo {
  page: number
  per_page: number
  total: number
  total_pages: number
  has_next: boolean
  has_prev: boolean
}

export class APIv2Response {
  static success<T>(data: T, meta?: Partial<APIMeta>): APIResponse<T> {
    return {
      success: true,
      data,
      meta: {
        request_id: this.generateRequestId(),
        timestamp: new Date().toISOString(),
        version: '2.0',
        ...meta,
      },
    }
  }

  static error(
    code: string,
    message: string,
    details?: any,
    statusCode: number = 400
  ): { response: APIResponse; statusCode: number } {
    return {
      response: {
        success: false,
        error: {
          code,
          message,
          details,
          documentation_url: `https://docs.yourdomain.com/api/errors/${code}`,
        },
        meta: {
          request_id: this.generateRequestId(),
          timestamp: new Date().toISOString(),
          version: '2.0',
        },
      },
      statusCode,
    }
  }

  static paginated<T>(
    data: T[],
    page: number,
    perPage: number,
    total: number,
    meta?: Partial<APIMeta>
  ): APIResponse<T[]> {
    const totalPages = Math.ceil(total / perPage)

    return {
      success: true,
      data,
      meta: {
        request_id: this.generateRequestId(),
        timestamp: new Date().toISOString(),
        version: '2.0',
        pagination: {
          page,
          per_page: perPage,
          total,
          total_pages: totalPages,
          has_next: page < totalPages,
          has_prev: page > 1,
        },
        ...meta,
      },
    }
  }

  private static generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substring(7)}`
  }
}

// API Error Codes
export const APIErrorCodes = {
  // Authentication
  UNAUTHORIZED: 'unauthorized',
  INVALID_API_KEY: 'invalid_api_key',
  API_KEY_EXPIRED: 'api_key_expired',
  INSUFFICIENT_PERMISSIONS: 'insufficient_permissions',

  // Rate Limiting
  RATE_LIMIT_EXCEEDED: 'rate_limit_exceeded',
  QUOTA_EXCEEDED: 'quota_exceeded',

  // Validation
  INVALID_REQUEST: 'invalid_request',
  MISSING_PARAMETER: 'missing_parameter',
  INVALID_PARAMETER: 'invalid_parameter',

  // Resources
  RESOURCE_NOT_FOUND: 'resource_not_found',
  RESOURCE_ALREADY_EXISTS: 'resource_already_exists',
  RESOURCE_CONFLICT: 'resource_conflict',

  // Server
  INTERNAL_ERROR: 'internal_error',
  SERVICE_UNAVAILABLE: 'service_unavailable',
  MAINTENANCE_MODE: 'maintenance_mode',
} as const

export type APIErrorCode = typeof APIErrorCodes[keyof typeof APIErrorCodes]

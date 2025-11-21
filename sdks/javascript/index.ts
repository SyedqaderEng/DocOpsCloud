// DocOps Cloud JavaScript/TypeScript SDK

export interface SDKConfig {
  apiKey: string
  baseUrl?: string
  timeout?: number
}

export interface APIResponse<T = any> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
    details?: any
  }
  meta?: {
    request_id: string
    timestamp: string
    version: string
    rate_limit?: {
      limit: number
      remaining: number
      reset: number
    }
    pagination?: {
      page: number
      per_page: number
      total: number
      total_pages: number
      has_next: boolean
      has_prev: boolean
    }
  }
}

export interface FileObject {
  id: string
  filename: string
  original_filename: string
  file_size: number
  mime_type: string
  status: string
  download_url?: string
  created_at: string
  updated_at: string
}

export interface WorkflowObject {
  id: string
  name: string
  description?: string
  trigger: any
  steps: any[]
  status: string
  created_at: string
}

export class DocOpsClient {
  private apiKey: string
  private baseUrl: string
  private timeout: number

  constructor(config: SDKConfig) {
    this.apiKey = config.apiKey
    this.baseUrl = config.baseUrl || 'https://api.docops.cloud'
    this.timeout = config.timeout || 30000
  }

  // Files API
  files = {
    list: async (page: number = 1, perPage: number = 25): Promise<APIResponse<FileObject[]>> => {
      return this.request('GET', `/v2/files?page=${page}&per_page=${perPage}`)
    },

    get: async (fileId: string): Promise<APIResponse<FileObject>> => {
      return this.request('GET', `/v2/files/${fileId}`)
    },

    upload: async (
      filename: string,
      content: string | Buffer,
      options?: { mimeType?: string; metadata?: any }
    ): Promise<APIResponse<FileObject>> => {
      const base64Content = typeof content === 'string'
        ? content
        : content.toString('base64')

      return this.request('POST', '/v2/files', {
        filename,
        content: base64Content,
        mime_type: options?.mimeType,
        metadata: options?.metadata,
      })
    },

    delete: async (fileId: string): Promise<APIResponse<void>> => {
      return this.request('DELETE', `/v2/files/${fileId}`)
    },
  }

  // Workflows API
  workflows = {
    list: async (page: number = 1, perPage: number = 25): Promise<APIResponse<WorkflowObject[]>> => {
      return this.request('GET', `/v2/workflows?page=${page}&per_page=${perPage}`)
    },

    get: async (workflowId: string): Promise<APIResponse<WorkflowObject>> => {
      return this.request('GET', `/v2/workflows/${workflowId}`)
    },

    create: async (workflow: {
      name: string
      description?: string
      trigger: any
      steps: any[]
    }): Promise<APIResponse<WorkflowObject>> => {
      return this.request('POST', '/v2/workflows', workflow)
    },

    trigger: async (workflowId: string, data?: any): Promise<APIResponse<{ runId: string }>> => {
      return this.request('POST', `/v2/workflows/${workflowId}/trigger`, { data })
    },

    delete: async (workflowId: string): Promise<APIResponse<void>> => {
      return this.request('DELETE', `/v2/workflows/${workflowId}`)
    },
  }

  // AI Operations
  ai = {
    summarize: async (
      text: string,
      options?: { length?: 'short' | 'medium' | 'long' }
    ): Promise<APIResponse<{ summary: string }>> => {
      return this.request('POST', '/v2/ai/summarize', { text, ...options })
    },

    translate: async (
      text: string,
      targetLanguage: string
    ): Promise<APIResponse<{ translated_text: string; source_language: string }>> => {
      return this.request('POST', '/v2/ai/translate', { text, target_language: targetLanguage })
    },

    extract: async (
      text: string,
      documentType: 'invoice' | 'contract' | 'resume' | 'receipt' | 'general'
    ): Promise<APIResponse<any>> => {
      return this.request('POST', '/v2/ai/extract', { text, document_type: documentType })
    },
  }

  // Integrations API
  integrations = {
    list: async (): Promise<APIResponse<any[]>> => {
      return this.request('GET', '/v2/integrations')
    },

    connect: async (provider: string): Promise<APIResponse<{ auth_url: string }>> => {
      return this.request('POST', `/v2/integrations/${provider}/connect`)
    },

    connections: async (): Promise<APIResponse<any[]>> => {
      return this.request('GET', '/v2/integrations/connections')
    },

    disconnect: async (connectionId: string): Promise<APIResponse<void>> => {
      return this.request('DELETE', `/v2/integrations/connections/${connectionId}`)
    },
  }

  // Private request method
  private async request(
    method: string,
    path: string,
    body?: any
  ): Promise<APIResponse> {
    const url = `${this.baseUrl}${path}`
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.timeout)

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.apiKey,
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      const data = await response.json()

      if (!response.ok) {
        throw new DocOpsError(
          data.error?.code || 'request_failed',
          data.error?.message || 'Request failed',
          response.status,
          data.error?.details
        )
      }

      return data
    } catch (error) {
      clearTimeout(timeoutId)

      if (error instanceof DocOpsError) {
        throw error
      }

      if (error instanceof Error && error.name === 'AbortError') {
        throw new DocOpsError('timeout', 'Request timeout', 408)
      }

      throw new DocOpsError(
        'network_error',
        error instanceof Error ? error.message : 'Network error',
        0
      )
    }
  }
}

export class DocOpsError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number,
    public details?: any
  ) {
    super(message)
    this.name = 'DocOpsError'
  }
}

// Export for CommonJS
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { DocOpsClient, DocOpsError }
}

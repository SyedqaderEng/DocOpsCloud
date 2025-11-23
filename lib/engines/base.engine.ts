/**
 * Universal Engine Base Interface
 * All category engines must implement this interface
 */

// ============================================================================
// Core Types
// ============================================================================

export interface LoadedFile {
  type: string // 'pdf', 'image', 'video', 'audio', 'doc', 'text', etc.
  path: string
  buffer: Buffer
  document?: any // Engine-specific document object (PDFDocument, Sharp, etc.)
  metadata: FileMetadata
}

export interface FileMetadata {
  pageCount?: number
  duration?: number // For video/audio in seconds
  width?: number // For images/video
  height?: number // For images/video
  format?: string
  size?: number
  title?: string
  author?: string
  [key: string]: any
}

export interface PreviewData {
  type: string
  pageCount?: number
  duration?: number
  pages?: PagePreview[]
  frames?: FramePreview[]
  thumbnail?: string // Base64 or URL
  metadata: FileMetadata
}

export interface PagePreview {
  number: number
  width: number
  height: number
  rotation?: number
  thumbnail: string // Base64 encoded image
}

export interface FramePreview {
  timestamp: number
  thumbnail: string
}

export interface ProcessResult {
  success: boolean
  document?: any // Processed document object
  buffer?: Buffer // Direct output buffer
  files?: string[] // Multiple output files
  metadata: {
    [key: string]: any
  }
  error?: string
}

export interface ProcessParams {
  [key: string]: any
}

// ============================================================================
// Universal Engine Interface
// ============================================================================

export interface UniversalEngine {
  /**
   * Load and parse a file
   * @param filePath - Absolute path to the input file
   * @returns LoadedFile with parsed document and metadata
   */
  load(filePath: string): Promise<LoadedFile>

  /**
   * Generate preview data (thumbnails, metadata)
   * @param loadedFile - File loaded by load()
   * @returns Preview data for frontend display
   */
  preview(loadedFile: LoadedFile): Promise<PreviewData>

  /**
   * Process the file with the specified operation
   * @param loadedFile - File loaded by load()
   * @param operation - Operation name (split, merge, compress, etc.)
   * @param params - Operation-specific parameters
   * @returns Processing result
   */
  process(
    loadedFile: LoadedFile,
    operation: string,
    params: ProcessParams
  ): Promise<ProcessResult>

  /**
   * Export the processed result to a buffer
   * @param processResult - Result from process()
   * @param format - Optional output format override
   * @returns Buffer ready for storage/download
   */
  export(processResult: ProcessResult, format?: string): Promise<Buffer>

  /**
   * Cleanup temporary files and resources
   * @param paths - Array of file paths to cleanup
   */
  cleanup(paths: string[]): Promise<void>
}

// ============================================================================
// Base Engine Abstract Class
// ============================================================================

export abstract class BaseEngine implements UniversalEngine {
  abstract load(filePath: string): Promise<LoadedFile>
  abstract preview(loadedFile: LoadedFile): Promise<PreviewData>
  abstract process(
    loadedFile: LoadedFile,
    operation: string,
    params: ProcessParams
  ): Promise<ProcessResult>
  abstract export(processResult: ProcessResult, format?: string): Promise<Buffer>

  /**
   * Default cleanup implementation
   * Can be overridden by specific engines if needed
   */
  async cleanup(paths: string[]): Promise<void> {
    const fs = require('fs/promises')
    await Promise.all(
      paths.map((path) =>
        fs.unlink(path).catch((err: any) => {
          console.warn(`Failed to cleanup ${path}:`, err.message)
        })
      )
    )
  }

  /**
   * Helper: Validate that operation is supported
   */
  protected validateOperation(operation: string, supportedOps: string[]): void {
    if (!supportedOps.includes(operation)) {
      throw new Error(
        `Unsupported operation: ${operation}. Supported: ${supportedOps.join(', ')}`
      )
    }
  }

  /**
   * Helper: Validate required parameters
   */
  protected validateParams(
    params: ProcessParams,
    required: string[],
    operation: string
  ): void {
    const missing = required.filter((key) => !(key in params))
    if (missing.length > 0) {
      throw new Error(
        `Missing required parameters for ${operation}: ${missing.join(', ')}`
      )
    }
  }
}

// ============================================================================
// Tool Configuration Types
// ============================================================================

export interface ToolConfig {
  category: string
  engine: string
  operation: string
  params: {
    [paramName: string]: ParamDefinition
  }
  description: string
}

export interface ParamDefinition {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object' | 'enum'
  required?: boolean
  default?: any
  values?: any[] // For enum type
  value?: any // For fixed value
  items?: ParamDefinition // For array type
  properties?: { [key: string]: ParamDefinition } // For object type
  min?: number
  max?: number
  pattern?: string
}

// ============================================================================
// Job Types
// ============================================================================

export interface JobData {
  jobId: string
  fileId: string
  engine: string
  operation: string
  params: ProcessParams
  userId?: string
}

export interface JobResult {
  jobId: string
  status: 'queued' | 'processing' | 'completed' | 'failed'
  progress?: number
  estimatedTime?: number
  outputFileId?: string
  downloadUrl?: string
  error?: string
}

// ============================================================================
// Storage Types
// ============================================================================

export interface StorageFile {
  fileId: string
  filename: string
  size: number
  mimeType: string
  storageKey: string
  metadata: FileMetadata
  uploadedAt: Date
  expiresAt: Date
}

export interface UploadResult {
  fileId: string
  filename: string
  size: number
  mimeType: string
  metadata: FileMetadata
}

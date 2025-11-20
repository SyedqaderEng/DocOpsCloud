import { Job } from 'bullmq'
import { SubscriptionTier } from '@prisma/client'

// Base job data interface
export interface BaseJobData {
  jobId: string
  userId: string
  inputFileId: string
  operationType: string
  operationParams?: Record<string, any>
  subscriptionTier: SubscriptionTier
}

// PDF job types
export interface PdfMergeJobData extends BaseJobData {
  operationType: 'pdf_merge'
  operationParams: {
    fileIds: string[]
  }
}

export interface PdfSplitJobData extends BaseJobData {
  operationType: 'pdf_split'
  operationParams: {
    pageRanges?: Array<{ start: number; end: number }>
    splitEvery?: number
  }
}

export interface PdfCompressJobData extends BaseJobData {
  operationType: 'pdf_compress'
  operationParams: {
    quality: 'low' | 'medium' | 'high'
  }
}

// Word job types
export interface WordConvertJobData extends BaseJobData {
  operationType: 'word_to_pdf' | 'word_to_html' | 'word_to_markdown'
}

// Excel job types
export interface ExcelConvertJobData extends BaseJobData {
  operationType: 'excel_to_csv' | 'csv_to_excel'
}

// Image job types
export interface ImageResizeJobData extends BaseJobData {
  operationType: 'image_resize'
  operationParams: {
    width?: number
    height?: number
    maintainAspectRatio?: boolean
  }
}

export interface ImageConvertJobData extends BaseJobData {
  operationType: 'image_convert'
  operationParams: {
    format: 'jpg' | 'png' | 'webp' | 'gif'
    quality?: number
  }
}

// Union type for all job data
export type ProcessingJobData =
  | PdfMergeJobData
  | PdfSplitJobData
  | PdfCompressJobData
  | WordConvertJobData
  | ExcelConvertJobData
  | ImageResizeJobData
  | ImageConvertJobData

// Job result interface
export interface JobResult {
  success: boolean
  outputFileId?: string
  outputFileUrl?: string
  error?: string
  processingTime?: number
  metadata?: Record<string, any>
}

// Job progress update
export interface JobProgress {
  progress: number // 0-100
  message?: string
  stage?: string
}

// Timeout limits per operation type (in milliseconds)
export const OPERATION_TIMEOUTS: Record<string, number> = {
  // PDF operations (5-10 minutes)
  pdf_merge: 10 * 60 * 1000,
  pdf_split: 5 * 60 * 1000,
  pdf_compress: 10 * 60 * 1000,
  pdf_convert: 10 * 60 * 1000,
  pdf_ocr: 15 * 60 * 1000, // OCR takes longer

  // Word operations (5 minutes)
  word_to_pdf: 5 * 60 * 1000,
  word_to_html: 3 * 60 * 1000,
  word_edit: 5 * 60 * 1000,

  // Excel operations (3-5 minutes)
  excel_to_csv: 3 * 60 * 1000,
  csv_to_excel: 3 * 60 * 1000,
  excel_process: 5 * 60 * 1000,

  // Image operations (2-5 minutes)
  image_resize: 2 * 60 * 1000,
  image_convert: 3 * 60 * 1000,
  image_compress: 3 * 60 * 1000,
  image_process: 5 * 60 * 1000,

  // Default
  default: 5 * 60 * 1000,
}

// Get timeout for operation
export function getOperationTimeout(operationType: string): number {
  return OPERATION_TIMEOUTS[operationType] || OPERATION_TIMEOUTS.default
}

// Type guard helpers
export function isPdfJob(job: Job): job is Job<PdfMergeJobData | PdfSplitJobData | PdfCompressJobData> {
  return job.data.operationType.startsWith('pdf_')
}

export function isWordJob(job: Job): job is Job<WordConvertJobData> {
  return job.data.operationType.startsWith('word_')
}

export function isExcelJob(job: Job): job is Job<ExcelConvertJobData> {
  return job.data.operationType.startsWith('excel_') || job.data.operationType.startsWith('csv_')
}

export function isImageJob(job: Job): job is Job<ImageResizeJobData | ImageConvertJobData> {
  return job.data.operationType.startsWith('image_')
}

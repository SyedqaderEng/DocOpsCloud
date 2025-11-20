import { User, File, ProcessingJob, Subscription } from '@prisma/client'

// Extended user type with relations
export type UserWithRelations = User & {
  subscription?: Subscription | null
}

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// File upload types
export interface FileUploadProgress {
  fileId: string
  progress: number
  status: 'uploading' | 'processing' | 'complete' | 'error'
}

// Processing job types
export interface JobProgress {
  jobId: string
  status: ProcessingJob['status']
  progress: number
  resultUrl?: string
  error?: string
}

// Pagination types
export interface PaginationParams {
  page: number
  limit: number
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

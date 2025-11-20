import { prisma } from '@/lib/db/prisma'
import { generateS3Key } from './s3'
import { FileType, UploadStatus, ProcessingStatus } from '@prisma/client'

export interface CreateFileOptions {
  userId: string
  originalName: string
  storedName: string
  fileType: FileType
  fileSize: bigint
  mimeType: string
  s3Url: string
}

/**
 * Determine file type from MIME type
 */
export function getFileTypeFromMime(mimeType: string): FileType {
  if (mimeType.includes('pdf')) return 'PDF'
  if (mimeType.includes('word') || mimeType.includes('docx')) return 'DOCX'
  if (mimeType.includes('excel') || mimeType.includes('xlsx')) return 'XLSX'
  if (mimeType.includes('csv')) return 'CSV'
  if (mimeType.startsWith('image/')) return 'IMAGE'
  return 'OTHER'
}

/**
 * Validate file size against subscription tier limits
 */
export function validateFileSize(fileSize: number, maxSize: number): boolean {
  return fileSize <= maxSize
}

/**
 * Validate file type
 */
export function validateFileType(mimeType: string, allowedTypes: string[]): boolean {
  return allowedTypes.some((type) => mimeType.includes(type))
}

/**
 * Get allowed MIME types for document processing
 */
export function getAllowedMimeTypes(): string[] {
  return [
    // PDF
    'application/pdf',
    // Word
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    // Excel
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    // CSV
    'text/csv',
    'application/csv',
    // Images
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/heic',
    'image/heif',
  ]
}

/**
 * Create file record in database
 */
export async function createFileRecord(options: CreateFileOptions) {
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

  return await prisma.file.create({
    data: {
      user_id: options.userId,
      original_name: options.originalName,
      stored_name: options.storedName,
      file_type: options.fileType,
      file_size: options.fileSize,
      mime_type: options.mimeType,
      s3_url: options.s3Url,
      upload_status: UploadStatus.UPLOADING,
      processing_status: ProcessingStatus.PENDING,
      expires_at: expiresAt,
    },
  })
}

/**
 * Update file upload status
 */
export async function updateFileUploadStatus(
  fileId: string,
  status: UploadStatus,
  s3Url?: string
) {
  return await prisma.file.update({
    where: { id: fileId },
    data: {
      upload_status: status,
      ...(s3Url && { s3_url: s3Url }),
    },
  })
}

/**
 * Mark file as upload complete
 */
export async function markFileUploadComplete(fileId: string, s3Url: string) {
  return await updateFileUploadStatus(fileId, UploadStatus.COMPLETE, s3Url)
}

/**
 * Mark file as upload failed
 */
export async function markFileUploadFailed(fileId: string) {
  return await updateFileUploadStatus(fileId, UploadStatus.FAILED)
}

/**
 * Get user's recent files
 */
export async function getUserFiles(userId: string, limit: number = 10) {
  return await prisma.file.findMany({
    where: {
      user_id: userId,
      upload_status: UploadStatus.COMPLETE,
    },
    orderBy: {
      created_at: 'desc',
    },
    take: limit,
  })
}

/**
 * Get file by ID with user check
 */
export async function getFileById(fileId: string, userId: string) {
  return await prisma.file.findFirst({
    where: {
      id: fileId,
      user_id: userId,
    },
  })
}

/**
 * Delete file record
 */
export async function deleteFileRecord(fileId: string) {
  return await prisma.file.delete({
    where: { id: fileId },
  })
}

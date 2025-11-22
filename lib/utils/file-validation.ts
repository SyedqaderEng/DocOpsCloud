import { TIER_LIMITS } from '@/lib/config/constants'
import { SubscriptionTier } from '@prisma/client'

export interface FileValidationResult {
  valid: boolean
  error?: string
  shouldUpgrade?: boolean
  maxSize?: number
  tier?: string
}

/**
 * Client-side file size validation before upload
 */
export function validateFileSize(
  file: File,
  userTier: SubscriptionTier = 'FREE'
): FileValidationResult {
  const limits = TIER_LIMITS[userTier]
  const maxSize = limits.max_file_size

  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File size (${formatFileSize(file.size)}) exceeds your plan limit of ${formatFileSize(maxSize)}`,
      shouldUpgrade: userTier === 'FREE',
      maxSize,
      tier: userTier,
    }
  }

  return {
    valid: true,
    maxSize,
    tier: userTier,
  }
}

/**
 * Validate multiple files
 */
export function validateMultipleFiles(
  files: File[],
  userTier: SubscriptionTier = 'FREE'
): FileValidationResult {
  for (const file of files) {
    const result = validateFileSize(file, userTier)
    if (!result.valid) {
      return result
    }
  }

  return {
    valid: true,
    tier: userTier,
  }
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}

/**
 * Get max file size for tier
 */
export function getMaxFileSize(tier: SubscriptionTier): number {
  return TIER_LIMITS[tier].max_file_size
}

/**
 * Get formatted max file size for tier
 */
export function getMaxFileSizeFormatted(tier: SubscriptionTier): string {
  return formatFileSize(getMaxFileSize(tier))
}

/**
 * Check if file type is allowed
 */
export function validateFileType(
  file: File,
  allowedTypes: string[]
): { valid: boolean; error?: string } {
  const extension = file.name.split('.').pop()?.toLowerCase()

  if (!extension || !allowedTypes.includes(extension)) {
    return {
      valid: false,
      error: `File type .${extension} is not supported. Allowed types: ${allowedTypes.join(', ')}`,
    }
  }

  return { valid: true }
}

/**
 * Comprehensive file validation (size + type)
 */
export function validateFile(
  file: File,
  userTier: SubscriptionTier,
  allowedTypes: string[]
): FileValidationResult {
  // Check file type first
  const typeCheck = validateFileType(file, allowedTypes)
  if (!typeCheck.valid) {
    return {
      valid: false,
      error: typeCheck.error,
      shouldUpgrade: false,
      tier: userTier,
    }
  }

  // Then check file size
  return validateFileSize(file, userTier)
}

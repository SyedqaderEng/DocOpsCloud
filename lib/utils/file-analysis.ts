/**
 * Smart File Analysis & Tool Suggestion System
 * Analyzes uploaded files and suggests appropriate tools
 */

export interface FileSuggestion {
  tool: string
  toolId: string
  reason: string
  priority: 'high' | 'medium' | 'low'
  icon: string
}

export interface FileAnalysis {
  fileCount: number
  totalSize: number
  fileTypes: string[]
  hasLargeFiles: boolean
  hasPDFs: boolean
  hasImages: boolean
  hasMultipleFiles: boolean
  suggestions: FileSuggestion[]
}

/**
 * Analyzes uploaded files and generates smart suggestions
 */
export async function analyzeFiles(files: File[]): Promise<FileAnalysis> {
  const fileCount = files.length
  const totalSize = files.reduce((sum, file) => sum + file.size, 0)
  const fileTypes = [...new Set(files.map(f => f.type))]

  const hasPDFs = files.some(f => f.type === 'application/pdf')
  const hasImages = files.some(f => f.type.startsWith('image/'))
  const hasMultipleFiles = files.length > 1
  const hasLargeFiles = files.some(f => f.size > 10 * 1024 * 1024) // > 10MB

  const suggestions: FileSuggestion[] = []

  // Multi-file suggestions
  if (hasMultipleFiles && hasPDFs) {
    suggestions.push({
      tool: 'Merge PDFs',
      toolId: 'pdf-merge',
      reason: `You uploaded ${fileCount} PDF files. Merge them into one document.`,
      priority: 'high',
      icon: '🔗'
    })
  }

  // Large file suggestions
  if (hasLargeFiles && hasPDFs) {
    const largeFiles = files.filter(f => f.size > 10 * 1024 * 1024)
    suggestions.push({
      tool: 'Compress PDF',
      toolId: 'pdf-compress',
      reason: `${largeFiles.length} file${largeFiles.length > 1 ? 's' : ''} exceed${largeFiles.length === 1 ? 's' : ''} 10MB. Reduce file size.`,
      priority: 'high',
      icon: '📦'
    })
  }

  // Image to PDF suggestion
  if (hasImages && !hasPDFs) {
    suggestions.push({
      tool: 'Images to PDF',
      toolId: 'image-to-pdf',
      reason: `Convert ${fileCount} image${fileCount > 1 ? 's' : ''} to PDF format.`,
      priority: 'high',
      icon: '🖼️'
    })
  }

  // Mixed content suggestion
  if (hasImages && hasPDFs) {
    suggestions.push({
      tool: 'PDF Editor',
      toolId: 'pdf-edit',
      reason: 'Combine images and PDFs in the editor.',
      priority: 'medium',
      icon: '✏️'
    })
  }

  // Single PDF suggestions
  if (fileCount === 1 && hasPDFs) {
    const file = files[0]

    // Try to detect if it might need OCR (very basic heuristic)
    if (file.name.toLowerCase().includes('scan')) {
      suggestions.push({
        tool: 'OCR PDF',
        toolId: 'pdf-ocr',
        reason: 'Detected scanned document. Extract text with OCR.',
        priority: 'high',
        icon: '📝'
      })
    }

    // Suggest split for large PDFs
    if (file.size > 20 * 1024 * 1024) {
      suggestions.push({
        tool: 'Split PDF',
        toolId: 'pdf-split',
        reason: 'Large PDF detected. Split into smaller sections.',
        priority: 'medium',
        icon: '✂️'
      })
    }

    // Common operations
    suggestions.push({
      tool: 'Rotate Pages',
      toolId: 'pdf-rotate',
      reason: 'Fix page orientation if needed.',
      priority: 'low',
      icon: '🔄'
    })

    suggestions.push({
      tool: 'Add Signature',
      toolId: 'pdf-sign',
      reason: 'Sign your document digitally.',
      priority: 'low',
      icon: '✍️'
    })

    suggestions.push({
      tool: 'Protect PDF',
      toolId: 'pdf-protect',
      reason: 'Add password protection.',
      priority: 'low',
      icon: '🔒'
    })
  }

  return {
    fileCount,
    totalSize,
    fileTypes,
    hasLargeFiles,
    hasPDFs,
    hasImages,
    hasMultipleFiles,
    suggestions: suggestions.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 }
      return priorityOrder[a.priority] - priorityOrder[b.priority]
    })
  }
}

/**
 * Get file type label
 */
export function getFileTypeLabel(mimeType: string): string {
  const typeMap: Record<string, string> = {
    'application/pdf': 'PDF',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'Word Document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'Excel Spreadsheet',
    'image/png': 'PNG Image',
    'image/jpeg': 'JPEG Image',
    'image/jpg': 'JPG Image',
    'image/gif': 'GIF Image',
    'image/webp': 'WebP Image',
    'text/csv': 'CSV File',
  }
  return typeMap[mimeType] || 'Unknown'
}

/**
 * Validate file before processing (enhanced validation)
 */
export interface FileValidationResult {
  valid: boolean
  error?: string
  warnings?: string[]
  suggestions?: string[]
}

export async function validateFile(file: File): Promise<FileValidationResult> {
  const warnings: string[] = []
  const suggestions: string[] = []

  // Check if file is corrupted (basic check)
  if (file.size === 0) {
    return {
      valid: false,
      error: 'File is empty or corrupted'
    }
  }

  // Check for password-protected PDFs (would need actual PDF parsing)
  if (file.type === 'application/pdf') {
    // This is a placeholder - real implementation would use PDF.js
    // to check if PDF is encrypted
    if (file.name.toLowerCase().includes('protected')) {
      warnings.push('File may be password-protected')
    }
  }

  // Check file name for special characters
  if (/[<>:"/\\|?*]/.test(file.name)) {
    warnings.push('File name contains special characters that may cause issues')
  }

  // Suggest compression for large files
  if (file.size > 50 * 1024 * 1024) {
    suggestions.push('Consider compressing this file before processing')
  }

  // Check for very old file formats
  if (file.name.endsWith('.doc') || file.name.endsWith('.xls')) {
    warnings.push('Old file format detected. Consider converting to modern format first')
  }

  return {
    valid: true,
    warnings: warnings.length > 0 ? warnings : undefined,
    suggestions: suggestions.length > 0 ? suggestions : undefined
  }
}

/**
 * Detect PDF characteristics (requires PDF.js)
 */
export async function analyzePDF(file: File): Promise<{
  pageCount?: number
  isScanned?: boolean
  hasImages?: boolean
  isLandscape?: boolean
  fileSize: number
}> {
  try {
    // This would use PDF.js to analyze the PDF
    // For now, return basic info
    return {
      fileSize: file.size,
      // These would be populated by actual PDF analysis
      pageCount: undefined,
      isScanned: file.name.toLowerCase().includes('scan'),
      hasImages: undefined,
      isLandscape: undefined
    }
  } catch (err) {
    return {
      fileSize: file.size
    }
  }
}

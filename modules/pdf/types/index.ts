/**
 * PDF Module Type Definitions
 */

export interface PdfPageRange {
  start: number
  end: number
}

export interface PdfMetadata {
  title?: string
  author?: string
  subject?: string
  creator?: string
  producer?: string
  keywords?: string[]
  creationDate?: Date
  modificationDate?: Date
  pageCount: number
}

export interface PdfCompressionOptions {
  quality: 'low' | 'medium' | 'high'
  optimizeImages?: boolean
  removeMetadata?: boolean
  downsampleDpi?: number
}

export interface PdfWatermarkOptions {
  text: string
  opacity?: number
  fontSize?: number
  color?: { r: number; g: number; b: number }
  rotation?: number
  position?: 'center' | 'diagonal'
}

export interface PdfHeaderFooterOptions {
  text: string
  fontSize?: number
  position?: 'left' | 'center' | 'right'
  margin?: number
}

export interface PdfPageNumberOptions {
  format?: 'number' | 'pageOfTotal'
  position?: 'bottom-center' | 'bottom-left' | 'bottom-right' | 'top-center'
  fontSize?: number
  startPage?: number
  prefix?: string
  suffix?: string
}

export interface PdfConversionOptions {
  format?: 'png' | 'jpg' | 'webp'
  quality?: number
  dpi?: number
  pageNumbers?: number[]
}

export interface PdfOcrOptions {
  language?: string
  pageNumbers?: number[]
}

export interface PdfOcrResult {
  text: string
  confidence: number
  pageTexts: Array<{ page: number; text: string; confidence: number }>
}

export interface PdfSignatureOptions {
  pageNumber?: number
  x?: number
  y?: number
  width?: number
  height?: number
  signerName?: string
  reason?: string
  location?: string
}

export interface PdfSplitResult {
  files: Buffer[]
  pageRanges: PdfPageRange[]
}

export interface PdfMergeOptions {
  removeBlankPages?: boolean
  addPageNumbers?: boolean
  maintainBookmarks?: boolean
}

/**
 * Word/DOCX Type Definitions
 *
 * Type definitions for Word document processing operations
 */

// Word conversion options
export interface WordToPdfOptions {
  pageSize?: 'A4' | 'Letter' | 'Legal'
  margin?: {
    top: number
    right: number
    bottom: number
    left: number
  }
  orientation?: 'portrait' | 'landscape'
}

export interface WordToHtmlOptions {
  includeStyles?: boolean
  includeImages?: boolean
  imageFormat?: 'base64' | 'url'
  cleanHtml?: boolean
}

export interface WordToMarkdownOptions {
  preserveFormatting?: boolean
  includeImages?: boolean
  headingStyle?: 'atx' | 'setext' // # vs underline
  bulletListMarker?: '-' | '*' | '+'
}

// Word metadata
export interface WordMetadata {
  title?: string
  author?: string
  subject?: string
  keywords?: string[]
  description?: string
  created?: Date
  modified?: Date
  lastModifiedBy?: string
  pageCount?: number
  wordCount?: number
  characterCount?: number
}

// Word conversion results
export interface WordConversionResult {
  content: string | Buffer
  format: 'pdf' | 'html' | 'markdown' | 'txt'
  metadata?: WordMetadata
  size: number
}

// Word extraction results
export interface WordTextExtractionResult {
  text: string
  wordCount: number
  characterCount: number
  paragraphCount: number
}

// Word manipulation options
export interface WordReplaceOptions {
  searchText: string
  replaceText: string
  matchCase?: boolean
  matchWholeWord?: boolean
  replaceAll?: boolean
}

export interface WordInsertOptions {
  position: 'start' | 'end' | number
  content: string
  format?: 'paragraph' | 'heading1' | 'heading2' | 'heading3'
}

// Export types for API usage
export type WordOperation =
  | 'word_to_pdf'
  | 'word_to_html'
  | 'word_to_markdown'
  | 'word_to_txt'
  | 'word_extract_text'
  | 'word_get_metadata'
  | 'word_replace_text'
  | 'word_merge'

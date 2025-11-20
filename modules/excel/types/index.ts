/**
 * Excel/CSV Type Definitions
 *
 * Type definitions for Excel and CSV processing operations
 */

// Excel to CSV conversion options
export interface ExcelToCsvOptions {
  sheetName?: string // Specific sheet to convert, or first sheet if not specified
  sheetIndex?: number // 0-based index
  delimiter?: ',' | ';' | '\t' | '|' // CSV delimiter
  encoding?: 'utf8' | 'utf16le' | 'latin1'
  includeHeaders?: boolean // Include first row as headers
  dateFormat?: string // Format for date columns
}

// CSV to Excel conversion options
export interface CsvToExcelOptions {
  sheetName?: string
  delimiter?: ',' | ';' | '\t' | '|'
  hasHeaders?: boolean // First row contains headers
  autoDetectTypes?: boolean // Auto-detect number, date, boolean types
  encoding?: 'utf8' | 'utf16le' | 'latin1'
}

// Excel metadata
export interface ExcelMetadata {
  fileName?: string
  creator?: string
  lastModifiedBy?: string
  created?: Date
  modified?: Date
  sheetCount?: number
  sheets?: SheetInfo[]
  rowCount?: number
  columnCount?: number
}

export interface SheetInfo {
  name: string
  index: number
  rowCount: number
  columnCount: number
  hasHeaders?: boolean
}

// Excel data manipulation options
export interface ExcelFilterOptions {
  sheetName?: string
  column: string | number
  operator: 'equals' | 'contains' | 'greaterThan' | 'lessThan' | 'between'
  value: string | number
  value2?: string | number // For 'between' operator
}

export interface ExcelSortOptions {
  sheetName?: string
  column: string | number
  order: 'asc' | 'desc'
}

export interface ExcelFormulaOptions {
  sheetName?: string
  cell: string // e.g., 'A1', 'B5'
  formula: string // e.g., '=SUM(A1:A10)'
}

// CSV parsing options
export interface CsvParseOptions {
  delimiter?: ',' | ';' | '\t' | '|'
  hasHeaders?: boolean
  encoding?: 'utf8' | 'utf16le' | 'latin1'
  skipEmptyLines?: boolean
  trim?: boolean
}

// Excel conversion result
export interface ExcelConversionResult {
  content: string | Buffer
  format: 'csv' | 'xlsx' | 'xls' | 'json'
  metadata?: ExcelMetadata
  size: number
  rowCount?: number
}

// CSV analysis result
export interface CsvAnalysisResult {
  rowCount: number
  columnCount: number
  headers?: string[]
  delimiter: string
  encoding: string
  hasHeaders: boolean
  estimatedTypes?: Record<string, 'string' | 'number' | 'date' | 'boolean'>
}

// Excel sheet data
export interface SheetData {
  name: string
  rows: any[][]
  headers?: string[]
  rowCount: number
  columnCount: number
}

// Export types for API usage
export type ExcelOperation =
  | 'excel_to_csv'
  | 'csv_to_excel'
  | 'excel_get_metadata'
  | 'excel_extract_sheet'
  | 'excel_merge_sheets'
  | 'excel_filter_data'
  | 'excel_sort_data'
  | 'csv_parse'
  | 'csv_analyze'

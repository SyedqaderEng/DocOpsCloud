/**
 * Excel Conversion Service
 *
 * Handles conversion between Excel (XLSX/XLS) and CSV formats
 * Uses: xlsx library for Excel/CSV operations
 */

import * as XLSX from 'xlsx'
import {
  ExcelToCsvOptions,
  CsvToExcelOptions,
  ExcelConversionResult,
  CsvAnalysisResult,
  ExcelMetadata,
  SheetInfo,
  SheetData,
} from '../types'

class ExcelConversionService {
  /**
   * Convert Excel to CSV
   */
  async excelToCsv(
    excelBuffer: Buffer,
    options: ExcelToCsvOptions = {}
  ): Promise<ExcelConversionResult> {
    const {
      sheetName,
      sheetIndex = 0,
      delimiter = ',',
      includeHeaders = true,
    } = options

    try {
      // Read Excel file
      const workbook = XLSX.read(excelBuffer, { type: 'buffer' })

      // Get sheet
      let sheet: XLSX.WorkSheet
      if (sheetName) {
        sheet = workbook.Sheets[sheetName]
        if (!sheet) {
          throw new Error(`Sheet "${sheetName}" not found`)
        }
      } else {
        const sheetNameToUse = workbook.SheetNames[sheetIndex]
        if (!sheetNameToUse) {
          throw new Error(`Sheet at index ${sheetIndex} not found`)
        }
        sheet = workbook.Sheets[sheetNameToUse]
      }

      // Convert to CSV
      const csvContent = XLSX.utils.sheet_to_csv(sheet, {
        FS: delimiter,
        blankrows: false,
      })

      // Get row count
      const rows = csvContent.split('\n').filter((line) => line.trim())
      const rowCount = includeHeaders ? rows.length - 1 : rows.length

      return {
        content: csvContent,
        format: 'csv',
        size: Buffer.byteLength(csvContent, 'utf8'),
        rowCount,
        metadata: {
          sheetCount: workbook.SheetNames.length,
          sheets: workbook.SheetNames.map((name, index) => ({
            name,
            index,
            rowCount: 0,
            columnCount: 0,
          })),
        },
      }
    } catch (error) {
      throw new Error(`Failed to convert Excel to CSV: ${error}`)
    }
  }

  /**
   * Convert CSV to Excel
   */
  async csvToExcel(
    csvBuffer: Buffer,
    options: CsvToExcelOptions = {}
  ): Promise<ExcelConversionResult> {
    const {
      sheetName = 'Sheet1',
      delimiter = ',',
      hasHeaders = true,
      autoDetectTypes = true,
      encoding = 'utf8',
    } = options

    try {
      // Convert buffer to string
      const csvContent = csvBuffer.toString(encoding)

      // Parse CSV
      const worksheet = XLSX.utils.aoa_to_sheet(
        this.parseCsvToArray(csvContent, delimiter)
      )

      // Create workbook
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)

      // Write to buffer
      const excelBuffer = XLSX.write(workbook, {
        type: 'buffer',
        bookType: 'xlsx',
      })

      // Get metadata
      const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1')
      const rowCount = range.e.r - range.s.r + 1
      const columnCount = range.e.c - range.s.c + 1

      return {
        content: excelBuffer,
        format: 'xlsx',
        size: excelBuffer.length,
        rowCount: hasHeaders ? rowCount - 1 : rowCount,
        metadata: {
          sheetCount: 1,
          rowCount,
          columnCount,
          sheets: [
            {
              name: sheetName,
              index: 0,
              rowCount,
              columnCount,
              hasHeaders,
            },
          ],
        },
      }
    } catch (error) {
      throw new Error(`Failed to convert CSV to Excel: ${error}`)
    }
  }

  /**
   * Get Excel metadata
   */
  async getMetadata(excelBuffer: Buffer): Promise<ExcelMetadata> {
    try {
      const workbook = XLSX.read(excelBuffer, { type: 'buffer', cellDates: true })

      const sheets: SheetInfo[] = workbook.SheetNames.map((name, index) => {
        const sheet = workbook.Sheets[name]
        const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1')
        return {
          name,
          index,
          rowCount: range.e.r - range.s.r + 1,
          columnCount: range.e.c - range.s.c + 1,
        }
      })

      return {
        sheetCount: workbook.SheetNames.length,
        sheets,
        creator: workbook.Props?.Creator,
        lastModifiedBy: workbook.Props?.LastAuthor,
        created: workbook.Props?.CreatedDate,
        modified: workbook.Props?.ModifiedDate,
      }
    } catch (error) {
      throw new Error(`Failed to get Excel metadata: ${error}`)
    }
  }

  /**
   * Extract specific sheet as CSV
   */
  async extractSheet(
    excelBuffer: Buffer,
    sheetNameOrIndex: string | number
  ): Promise<ExcelConversionResult> {
    try {
      const workbook = XLSX.read(excelBuffer, { type: 'buffer' })

      let sheet: XLSX.WorkSheet
      let actualSheetName: string

      if (typeof sheetNameOrIndex === 'number') {
        actualSheetName = workbook.SheetNames[sheetNameOrIndex]
        if (!actualSheetName) {
          throw new Error(`Sheet at index ${sheetNameOrIndex} not found`)
        }
        sheet = workbook.Sheets[actualSheetName]
      } else {
        actualSheetName = sheetNameOrIndex
        sheet = workbook.Sheets[sheetNameOrIndex]
        if (!sheet) {
          throw new Error(`Sheet "${sheetNameOrIndex}" not found`)
        }
      }

      const csvContent = XLSX.utils.sheet_to_csv(sheet)

      return {
        content: csvContent,
        format: 'csv',
        size: Buffer.byteLength(csvContent, 'utf8'),
        metadata: {
          sheets: [
            {
              name: actualSheetName,
              index: workbook.SheetNames.indexOf(actualSheetName),
              rowCount: 0,
              columnCount: 0,
            },
          ],
        },
      }
    } catch (error) {
      throw new Error(`Failed to extract sheet: ${error}`)
    }
  }

  /**
   * Get sheet data as JSON
   */
  async getSheetData(
    excelBuffer: Buffer,
    sheetNameOrIndex: string | number = 0
  ): Promise<SheetData> {
    try {
      const workbook = XLSX.read(excelBuffer, { type: 'buffer' })

      let sheet: XLSX.WorkSheet
      let actualSheetName: string

      if (typeof sheetNameOrIndex === 'number') {
        actualSheetName = workbook.SheetNames[sheetNameOrIndex]
        sheet = workbook.Sheets[actualSheetName]
      } else {
        actualSheetName = sheetNameOrIndex
        sheet = workbook.Sheets[sheetNameOrIndex]
      }

      // Convert to array of arrays
      const rows: any[][] = XLSX.utils.sheet_to_json(sheet, {
        header: 1,
        raw: false,
        defval: '',
      })

      const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1')
      const rowCount = range.e.r - range.s.r + 1
      const columnCount = range.e.c - range.s.c + 1

      // Extract headers (first row)
      const headers = rows.length > 0 ? rows[0].map((h: any) => String(h)) : undefined

      return {
        name: actualSheetName,
        rows,
        headers,
        rowCount,
        columnCount,
      }
    } catch (error) {
      throw new Error(`Failed to get sheet data: ${error}`)
    }
  }

  /**
   * Analyze CSV file
   */
  async analyzeCsv(csvBuffer: Buffer): Promise<CsvAnalysisResult> {
    try {
      const csvContent = csvBuffer.toString('utf8')

      // Detect delimiter
      const delimiter = this.detectDelimiter(csvContent)

      // Parse CSV
      const rows = this.parseCsvToArray(csvContent, delimiter)

      const rowCount = rows.length
      const columnCount = rows.length > 0 ? rows[0].length : 0
      const hasHeaders = this.detectHeaders(rows)
      const headers = hasHeaders && rows.length > 0 ? rows[0].map(String) : undefined

      // Estimate column types
      const estimatedTypes = this.estimateColumnTypes(rows, hasHeaders)

      return {
        rowCount: hasHeaders ? rowCount - 1 : rowCount,
        columnCount,
        headers,
        delimiter,
        encoding: 'utf8',
        hasHeaders,
        estimatedTypes,
      }
    } catch (error) {
      throw new Error(`Failed to analyze CSV: ${error}`)
    }
  }

  /**
   * Parse CSV to array of arrays
   */
  private parseCsvToArray(csvContent: string, delimiter: string = ','): any[][] {
    const lines = csvContent.split(/\r?\n/)
    const rows: any[][] = []

    for (const line of lines) {
      if (!line.trim()) continue

      // Simple CSV parsing (doesn't handle quoted fields with delimiters)
      // For production, use a proper CSV parser like papaparse
      const values = line.split(delimiter).map((v) => v.trim())
      rows.push(values)
    }

    return rows
  }

  /**
   * Detect CSV delimiter
   */
  private detectDelimiter(csvContent: string): string {
    const firstLine = csvContent.split(/\r?\n/)[0]
    if (!firstLine) return ','

    const delimiters = [',', ';', '\t', '|']
    const counts = delimiters.map((d) => ({
      delimiter: d,
      count: (firstLine.match(new RegExp(`\\${d}`, 'g')) || []).length,
    }))

    counts.sort((a, b) => b.count - a.count)
    return counts[0].count > 0 ? counts[0].delimiter : ','
  }

  /**
   * Detect if first row contains headers
   */
  private detectHeaders(rows: any[][]): boolean {
    if (rows.length < 2) return false

    const firstRow = rows[0]
    const secondRow = rows[1]

    // Check if first row values are all strings
    const firstRowAllStrings = firstRow.every((v) => typeof v === 'string')

    // Check if second row has different types
    const hasNumbersInSecondRow = secondRow.some((v) => !isNaN(Number(v)))

    return firstRowAllStrings && hasNumbersInSecondRow
  }

  /**
   * Estimate column data types
   */
  private estimateColumnTypes(
    rows: any[][],
    hasHeaders: boolean
  ): Record<string, 'string' | 'number' | 'date' | 'boolean'> {
    const types: Record<string, 'string' | 'number' | 'date' | 'boolean'> = {}

    if (rows.length < (hasHeaders ? 2 : 1)) return types

    const dataRows = hasHeaders ? rows.slice(1) : rows
    const headerRow = hasHeaders ? rows[0] : rows[0].map((_, i) => `Column${i + 1}`)

    headerRow.forEach((header, colIndex) => {
      const columnValues = dataRows.map((row) => row[colIndex]).filter((v) => v !== '')

      if (columnValues.length === 0) {
        types[String(header)] = 'string'
        return
      }

      // Check if all values are numbers
      if (columnValues.every((v) => !isNaN(Number(v)))) {
        types[String(header)] = 'number'
        return
      }

      // Check if all values are booleans
      if (
        columnValues.every(
          (v) =>
            String(v).toLowerCase() === 'true' || String(v).toLowerCase() === 'false'
        )
      ) {
        types[String(header)] = 'boolean'
        return
      }

      // Check if values look like dates
      if (columnValues.every((v) => !isNaN(Date.parse(String(v))))) {
        types[String(header)] = 'date'
        return
      }

      types[String(header)] = 'string'
    })

    return types
  }

  /**
   * Get file size information
   */
  async getFileSize(buffer: Buffer): Promise<{
    bytes: number
    kilobytes: number
    megabytes: number
    formatted: string
  }> {
    const bytes = buffer.length
    const kilobytes = bytes / 1024
    const megabytes = kilobytes / 1024

    let formatted: string
    if (megabytes >= 1) {
      formatted = `${megabytes.toFixed(2)} MB`
    } else if (kilobytes >= 1) {
      formatted = `${kilobytes.toFixed(2)} KB`
    } else {
      formatted = `${bytes} bytes`
    }

    return { bytes, kilobytes, megabytes, formatted }
  }
}

export const excelConversionService = new ExcelConversionService()

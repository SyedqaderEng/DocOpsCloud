/**
 * Excel/CSV Processing Module
 *
 * Handles Excel and CSV file operations with S3 integration
 * Supports: Excel to CSV, CSV to Excel, sheet extraction, data analysis
 */

import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3'
import { excelConversionService } from '@/modules/excel/services/conversion'
import type {
  ExcelToCsvOptions,
  CsvToExcelOptions,
  ExcelConversionResult,
  ExcelMetadata,
  SheetData,
  CsvAnalysisResult,
} from '@/modules/excel/types'

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
})

const BUCKET_NAME = process.env.S3_BUCKET_NAME || ''

export class ExcelProcessor {
  /**
   * Download file from S3
   */
  private async downloadFromS3(s3Key: string): Promise<Buffer> {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: s3Key,
    })

    const response = await s3Client.send(command)
    const chunks: Uint8Array[] = []

    if (!response.Body) {
      throw new Error('Empty response from S3')
    }

    // @ts-ignore - Body is a readable stream
    for await (const chunk of response.Body) {
      chunks.push(chunk)
    }

    return Buffer.concat(chunks)
  }

  /**
   * Upload file to S3
   */
  private async uploadToS3(
    buffer: Buffer,
    fileName: string,
    contentType: string
  ): Promise<string> {
    const s3Key = `processed/${Date.now()}-${fileName}`

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: s3Key,
      Body: buffer,
      ContentType: contentType,
    })

    await s3Client.send(command)
    return s3Key
  }

  /**
   * Convert Excel to CSV
   */
  async convertExcelToCsv(
    inputS3Key: string,
    options: ExcelToCsvOptions = {}
  ): Promise<{
    outputS3Key: string
    result: ExcelConversionResult
  }> {
    // Download Excel file from S3
    const excelBuffer = await this.downloadFromS3(inputS3Key)

    // Convert to CSV
    const result = await excelConversionService.excelToCsv(excelBuffer, options)

    // Upload CSV to S3
    const outputS3Key = await this.uploadToS3(
      Buffer.from(result.content as string),
      'converted.csv',
      'text/csv'
    )

    return { outputS3Key, result }
  }

  /**
   * Convert CSV to Excel
   */
  async convertCsvToExcel(
    inputS3Key: string,
    options: CsvToExcelOptions = {}
  ): Promise<{
    outputS3Key: string
    result: ExcelConversionResult
  }> {
    // Download CSV file from S3
    const csvBuffer = await this.downloadFromS3(inputS3Key)

    // Convert to Excel
    const result = await excelConversionService.csvToExcel(csvBuffer, options)

    // Upload Excel to S3
    const outputS3Key = await this.uploadToS3(
      result.content as Buffer,
      'converted.xlsx',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    )

    return { outputS3Key, result }
  }

  /**
   * Get Excel metadata
   */
  async getMetadata(inputS3Key: string): Promise<ExcelMetadata> {
    const excelBuffer = await this.downloadFromS3(inputS3Key)
    return await excelConversionService.getMetadata(excelBuffer)
  }

  /**
   * Extract specific sheet as CSV
   */
  async extractSheet(
    inputS3Key: string,
    sheetNameOrIndex: string | number
  ): Promise<{
    outputS3Key: string
    result: ExcelConversionResult
  }> {
    // Download Excel file from S3
    const excelBuffer = await this.downloadFromS3(inputS3Key)

    // Extract sheet
    const result = await excelConversionService.extractSheet(excelBuffer, sheetNameOrIndex)

    // Upload CSV to S3
    const outputS3Key = await this.uploadToS3(
      Buffer.from(result.content as string),
      `sheet-${sheetNameOrIndex}.csv`,
      'text/csv'
    )

    return { outputS3Key, result }
  }

  /**
   * Get sheet data as JSON
   */
  async getSheetData(
    inputS3Key: string,
    sheetNameOrIndex: string | number = 0
  ): Promise<SheetData> {
    const excelBuffer = await this.downloadFromS3(inputS3Key)
    return await excelConversionService.getSheetData(excelBuffer, sheetNameOrIndex)
  }

  /**
   * Analyze CSV file
   */
  async analyzeCsv(inputS3Key: string): Promise<CsvAnalysisResult> {
    const csvBuffer = await this.downloadFromS3(inputS3Key)
    return await excelConversionService.analyzeCsv(csvBuffer)
  }

  /**
   * Get file size
   */
  async getFileSize(inputS3Key: string): Promise<{
    bytes: number
    kilobytes: number
    megabytes: number
    formatted: string
  }> {
    const buffer = await this.downloadFromS3(inputS3Key)
    return await excelConversionService.getFileSize(buffer)
  }
}

export const excelProcessor = new ExcelProcessor()

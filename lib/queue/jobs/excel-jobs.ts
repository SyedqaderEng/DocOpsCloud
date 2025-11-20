/**
 * Excel/CSV Job Queue Functions
 */

import { excelQueue } from '../client'
import type { ExcelToCsvOptions, CsvToExcelOptions } from '@/modules/excel/types'

export interface ExcelToCsvJobData {
  jobId: string
  userId: string
  inputS3Key: string
  options: ExcelToCsvOptions
}

export interface CsvToExcelJobData {
  jobId: string
  userId: string
  inputS3Key: string
  options: CsvToExcelOptions
}

/**
 * Add Excel to CSV conversion job
 */
export async function addExcelToCsvJob(data: ExcelToCsvJobData) {
  return await excelQueue.add('excel_to_csv', data, {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  })
}

/**
 * Add CSV to Excel conversion job
 */
export async function addCsvToExcelJob(data: CsvToExcelJobData) {
  return await excelQueue.add('csv_to_excel', data, {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  })
}

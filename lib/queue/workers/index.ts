import { PdfWorker } from './pdf-worker'
import { WordWorker } from './word-worker'
import { ExcelWorker } from './excel-worker'
import { ImageWorker } from './image-worker'

// Initialize workers
let pdfWorker: PdfWorker | null = null
let wordWorker: WordWorker | null = null
let excelWorker: ExcelWorker | null = null
let imageWorker: ImageWorker | null = null

/**
 * Start all workers
 */
export async function startWorkers(): Promise<void> {
  console.log('Starting workers...')

  // Start PDF worker
  pdfWorker = new PdfWorker()
  console.log('✓ PDF worker started')

  // Start Word worker
  wordWorker = new WordWorker()
  console.log('✓ Word worker started')

  // Start Excel worker
  excelWorker = new ExcelWorker()
  console.log('✓ Excel worker started')

  // Start Image worker
  imageWorker = new ImageWorker()
  console.log('✓ Image worker started')

  console.log('All workers started successfully')
}

/**
 * Stop all workers gracefully
 */
export async function stopWorkers(): Promise<void> {
  console.log('Stopping workers...')

  if (pdfWorker) {
    await pdfWorker.close()
    pdfWorker = null
  }

  if (wordWorker) {
    await wordWorker.close()
    wordWorker = null
  }

  if (excelWorker) {
    await excelWorker.close()
    excelWorker = null
  }

  if (imageWorker) {
    await imageWorker.close()
    imageWorker = null
  }

  console.log('All workers stopped')
}

/**
 * Get worker health status
 */
export function getWorkersHealth(): Record<string, boolean> {
  return {
    pdf: pdfWorker !== null,
    word: wordWorker !== null,
    excel: excelWorker !== null,
    image: imageWorker !== null,
  }
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, stopping workers...')
  await stopWorkers()
  process.exit(0)
})

process.on('SIGINT', async () => {
  console.log('SIGINT received, stopping workers...')
  await stopWorkers()
  process.exit(0)
})

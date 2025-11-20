import { PdfWorker } from './pdf-worker'
import { WordWorker } from './word-worker'

// Initialize workers
let pdfWorker: PdfWorker | null = null
let wordWorker: WordWorker | null = null

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

  // TODO: Add more workers for Excel, Image processing

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

  // TODO: Stop Excel and Image workers

  console.log('All workers stopped')
}

/**
 * Get worker health status
 */
export function getWorkersHealth(): Record<string, boolean> {
  return {
    pdf: pdfWorker !== null,
    word: wordWorker !== null,
    // TODO: Add Excel and Image worker statuses
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

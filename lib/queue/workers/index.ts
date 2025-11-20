import { PdfWorker } from './pdf-worker'

// Initialize workers
let pdfWorker: PdfWorker | null = null

/**
 * Start all workers
 */
export async function startWorkers(): Promise<void> {
  console.log('Starting workers...')

  // Start PDF worker
  pdfWorker = new PdfWorker()

  // TODO: Add more workers for Word, Excel, Image processing

  console.log('All workers started')
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

  // TODO: Stop other workers

  console.log('All workers stopped')
}

/**
 * Get worker health status
 */
export function getWorkersHealth(): Record<string, boolean> {
  return {
    pdf: pdfWorker !== null,
    // TODO: Add other worker statuses
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

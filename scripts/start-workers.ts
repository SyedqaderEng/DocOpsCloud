/**
 * Worker Startup Script
 * Starts all BullMQ workers to process jobs
 */

import { PdfWorker } from '../lib/queue/workers/pdf-worker'
import { WordWorker } from '../lib/queue/workers/word-worker'
import { ExcelWorker } from '../lib/queue/workers/excel-worker'
import { ImageWorker } from '../lib/queue/workers/image-worker'

console.log('🚀 Starting DocOpsCloud Workers...')
console.log('================================')

// Start all workers
const pdfWorker = new PdfWorker()
console.log('✓ PDF Worker started')

const wordWorker = new WordWorker()
console.log('✓ Word Worker started')

const excelWorker = new ExcelWorker()
console.log('✓ Excel Worker started')

const imageWorker = new ImageWorker()
console.log('✓ Image Worker started')

console.log('================================')
console.log('✅ All workers running!')
console.log('Press Ctrl+C to stop')

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('\n🛑 Received SIGTERM, shutting down gracefully...')

  await Promise.all([
    pdfWorker.close?.(),
    wordWorker.close?.(),
    excelWorker.close?.(),
    imageWorker.close?.(),
  ])

  console.log('✓ All workers closed')
  process.exit(0)
})

process.on('SIGINT', async () => {
  console.log('\n🛑 Received SIGINT, shutting down gracefully...')

  await Promise.all([
    pdfWorker.close?.(),
    wordWorker.close?.(),
    excelWorker.close?.(),
    imageWorker.close?.(),
  ])

  console.log('✓ All workers closed')
  process.exit(0)
})

/**
 * Worker Startup Script
 * Starts the Universal Job Processor Worker
 */

import { startWorker } from '../lib/workers/job-processor.worker'

async function main() {
  console.log('===========================================')
  console.log('  DocOpsCloud Universal Job Processor')
  console.log('===========================================\n')

  console.log('🚀 Starting worker...\n')

  // Start the universal job processor worker
  const worker = startWorker()

  console.log('✅ Worker started successfully')
  console.log('📊 Processing jobs from queue: file-processing')
  console.log('🔧 Available engines: PDFEngine')
  console.log('\nPress Ctrl+C to stop worker\n')

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    console.log('\n🛑 Received SIGTERM, shutting down gracefully...')
    await worker.shutdown()
    console.log('✓ Worker closed')
    process.exit(0)
  })

  process.on('SIGINT', async () => {
    console.log('\n🛑 Received SIGINT, shutting down gracefully...')
    await worker.shutdown()
    console.log('✓ Worker closed')
    process.exit(0)
  })
}

main().catch((error) => {
  console.error('❌ Failed to start worker:', error)
  process.exit(1)
})

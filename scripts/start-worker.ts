#!/usr/bin/env node

/**
 * Background Worker Startup Script
 *
 * This script starts the background worker that processes PDF jobs.
 * Run with: npm run worker
 *
 * Make sure Redis is running before starting the worker.
 */

import { createPDFWorker } from '../lib/workers/pdf-processor'

console.log('🚀 Starting PDF Processing Worker...')
console.log('📍 Environment:', process.env.NODE_ENV || 'development')
console.log('🔌 Redis URL:', process.env.REDIS_URL || 'Not configured (using mock)')

const worker = createPDFWorker()

if (!worker) {
  console.log('⚠️  Worker not created - Redis not available')
  console.log('💡 To enable background processing:')
  console.log('   1. Install Redis: brew install redis (macOS) or apt-get install redis (Linux)')
  console.log('   2. Start Redis: redis-server')
  console.log('   3. Set REDIS_URL in .env: REDIS_URL=redis://localhost:6379')
  console.log('   4. Run this script again')
  process.exit(0)
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n⏸️  Shutting down worker gracefully...')
  await worker.close()
  console.log('✅ Worker shut down complete')
  process.exit(0)
})

process.on('SIGTERM', async () => {
  console.log('\n⏸️  Shutting down worker gracefully...')
  await worker.close()
  console.log('✅ Worker shut down complete')
  process.exit(0)
})

console.log('✅ Worker is running and waiting for jobs...')
console.log('📊 Press Ctrl+C to stop')

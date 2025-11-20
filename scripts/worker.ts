#!/usr/bin/env ts-node

/**
 * Worker process for processing background jobs
 *
 * Usage:
 *   npm run worker
 *
 * This script starts all job workers and keeps them running.
 * It handles graceful shutdown on SIGTERM/SIGINT.
 */

import { startWorkers, stopWorkers } from '../lib/queue/workers'

async function main() {
  console.log('DocOpsCloud Worker Process')
  console.log('===========================')
  console.log(`Started at: ${new Date().toISOString()}`)
  console.log(`Node version: ${process.version}`)
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`)
  console.log('')

  try {
    // Start all workers
    await startWorkers()

    console.log('')
    console.log('Worker process is running. Press Ctrl+C to stop.')
    console.log('')

    // Keep process running
    process.stdin.resume()
  } catch (error) {
    console.error('Failed to start workers:', error)
    process.exit(1)
  }
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error)
  stopWorkers().then(() => process.exit(1))
})

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled rejection at:', promise, 'reason:', reason)
  stopWorkers().then(() => process.exit(1))
})

// Start the worker
main()

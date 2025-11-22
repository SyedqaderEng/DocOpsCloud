import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/auth/session'
import { queues, QUEUE_NAMES, REDIS_ENABLED } from '@/lib/queue/client'
import { prisma } from '@/lib/db/prisma'
import { z } from 'zod'

const queuePositionSchema = z.object({
  jobId: z.string().cuid(),
})

/**
 * GET /api/queue/position?jobId=xxx
 * Get the position of a job in the queue
 */
export async function GET(req: NextRequest) {
  try {
    const user = await requireUser()

    const { searchParams } = new URL(req.url)
    const jobId = searchParams.get('jobId')

    if (!jobId) {
      return NextResponse.json(
        { error: 'jobId query parameter is required' },
        { status: 400 }
      )
    }

    // Get job from database
    const jobRecord = await prisma.processingJob.findFirst({
      where: {
        id: jobId,
        user_id: user.id,
      },
    })

    if (!jobRecord) {
      return NextResponse.json(
        { error: 'Job not found or access denied' },
        { status: 404 }
      )
    }

    // If job is already completed or failed, return status
    if (jobRecord.status === 'COMPLETE' || jobRecord.status === 'FAILED') {
      return NextResponse.json({
        success: true,
        data: {
          jobId,
          status: jobRecord.status.toLowerCase(),
          position: 0,
          estimatedWaitTimeMs: 0,
          message: `Job is ${jobRecord.status.toLowerCase()}`,
        },
      })
    }

    // Determine which queue the job is in
    const queueName = getQueueNameFromOperation(jobRecord.operation_type)

    if (!REDIS_ENABLED) {
      // Mock response when Redis is not enabled
      return NextResponse.json({
        success: true,
        data: {
          jobId,
          status: jobRecord.status.toLowerCase(),
          position: 1,
          estimatedWaitTimeMs: 5000,
          queueStats: {
            waiting: 1,
            active: 1,
            completed: 0,
            failed: 0,
          },
          message: 'Queue position tracking requires Redis',
        },
      })
    }

    const queue = queues[queueName]

    // Get waiting jobs
    const waitingJobs = await queue.getJobs(['waiting'])
    const activeJobs = await queue.getJobs(['active'])

    // Find position in queue
    let position = waitingJobs.findIndex((j: any) => j.id === jobId)

    // If not in waiting queue, check if it's active
    const isActive = activeJobs.some((j: any) => j.id === jobId)

    if (isActive) {
      position = 0 // Currently processing
    } else if (position === -1) {
      // Job not found in queue, might be completed or delayed
      position = -1
    } else {
      position += 1 // Convert to 1-based index
    }

    // Calculate estimated wait time
    // Assume average processing time of 30 seconds per job
    const avgProcessingTimeMs = 30 * 1000
    const estimatedWaitTimeMs = position > 0 ? position * avgProcessingTimeMs : 0

    // Get queue statistics
    const [waiting, active, completed, failed] = await Promise.all([
      queue.getWaitingCount(),
      queue.getActiveCount(),
      queue.getCompletedCount(),
      queue.getFailedCount(),
    ])

    return NextResponse.json({
      success: true,
      data: {
        jobId,
        status: isActive ? 'processing' : 'waiting',
        position: position > 0 ? position : 0,
        estimatedWaitTimeMs,
        queueStats: {
          waiting,
          active,
          completed,
          failed,
        },
        queue: queueName,
        message: isActive
          ? 'Your job is currently being processed'
          : position > 0
          ? `Your job is #${position} in queue`
          : 'Your job will start processing soon',
      },
    })
  } catch (error) {
    console.error('Queue position error:', error)

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json({ error: 'Failed to get queue position' }, { status: 500 })
  }
}

/**
 * Helper function to determine queue name from operation type
 */
function getQueueNameFromOperation(operationType: string): string {
  if (operationType.startsWith('pdf_')) {
    return QUEUE_NAMES.PDF
  } else if (operationType.startsWith('word_')) {
    return QUEUE_NAMES.WORD
  } else if (operationType.startsWith('excel_') || operationType.startsWith('csv_')) {
    return QUEUE_NAMES.EXCEL
  } else if (operationType.startsWith('image_')) {
    return QUEUE_NAMES.IMAGE
  }
  return QUEUE_NAMES.GENERAL
}

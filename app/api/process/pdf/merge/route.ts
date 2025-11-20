import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuth } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'
import { enqueueJob } from '@/lib/queue/client'
import { JobPriority, JobType } from '@/lib/queue/types'

const mergeSchema = z.object({
  fileIds: z.array(z.string()).min(2, 'At least 2 files required'),
})

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const session = await requireAuth()
    const userId = session.user.id

    // Parse and validate request body
    const body = await request.json()
    const { fileIds } = mergeSchema.parse(body)

    // Validate all files exist and belong to user
    const files = await prisma.file.findMany({
      where: {
        id: { in: fileIds },
        user_id: userId,
        upload_status: 'COMPLETED',
      },
    })

    if (files.length !== fileIds.length) {
      return NextResponse.json(
        { error: 'One or more files not found or not ready' },
        { status: 400 }
      )
    }

    // Create processing job
    const job = await prisma.processingJob.create({
      data: {
        user_id: userId,
        job_type: JobType.PDF_MERGE,
        input_file_ids: fileIds,
        status: 'PENDING',
        priority: session.user.subscription_tier === 'BUSINESS' ? 1 :
                  session.user.subscription_tier === 'PRO' ? 5 : 10,
      },
    })

    // Enqueue job
    await enqueueJob(
      'pdf-processing',
      {
        jobId: job.id,
        userId,
        inputFileId: fileIds[0], // Primary input file
        operationType: 'pdf_merge',
        operationParams: { fileIds },
        subscriptionTier: session.user.subscription_tier,
      },
      {
        priority: job.priority as JobPriority,
        attempts: 3,
      }
    )

    return NextResponse.json({
      jobId: job.id,
      status: 'PENDING',
      message: 'PDF merge job created successfully',
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    console.error('PDF merge error:', error)
    return NextResponse.json(
      { error: 'Failed to create merge job' },
      { status: 500 }
    )
  }
}

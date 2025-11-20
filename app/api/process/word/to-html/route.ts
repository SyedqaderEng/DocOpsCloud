import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuth } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'
import { enqueueJob } from '@/lib/queue/client'
import { JobPriority, JobType } from '@/lib/queue/types'

const toHtmlSchema = z.object({
  fileId: z.string(),
  includeStyles: z.boolean().default(true),
  includeImages: z.boolean().default(true),
  cleanHtml: z.boolean().default(false),
})

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const session = await requireAuth()
    const userId = session.user.id

    // Parse and validate request body
    const body = await request.json()
    const { fileId, includeStyles, includeImages, cleanHtml } = toHtmlSchema.parse(body)

    // Validate file exists and belongs to user
    const file = await prisma.file.findFirst({
      where: {
        id: fileId,
        user_id: userId,
        upload_status: 'COMPLETED',
      },
    })

    if (!file) {
      return NextResponse.json({ error: 'File not found or not ready' }, { status: 404 })
    }

    // Create processing job
    const job = await prisma.processingJob.create({
      data: {
        user_id: userId,
        job_type: JobType.WORD_TO_HTML,
        input_file_ids: [fileId],
        status: 'PENDING',
        priority:
          session.user.subscription_tier === 'BUSINESS'
            ? 1
            : session.user.subscription_tier === 'PRO'
              ? 5
              : 10,
      },
    })

    // Enqueue job
    await enqueueJob(
      'word-processing',
      {
        jobId: job.id,
        userId,
        inputFileId: fileId,
        operationType: 'word_to_html',
        operationParams: { includeStyles, includeImages, cleanHtml },
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
      message: 'Word to HTML conversion job created successfully',
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Word to HTML error:', error)
    return NextResponse.json(
      { error: 'Failed to create Word to HTML conversion job' },
      { status: 500 }
    )
  }
}

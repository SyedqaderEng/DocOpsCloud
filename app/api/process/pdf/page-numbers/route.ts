import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuth } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'
import { enqueueJob } from '@/lib/queue/client'
import { JobPriority, JobType } from '@/lib/queue/types'

const pageNumbersSchema = z.object({
  fileId: z.string(),
  format: z.enum(['number', 'pageOfTotal']).default('number'),
  position: z
    .enum(['bottom-center', 'bottom-left', 'bottom-right', 'top-center'])
    .default('bottom-center'),
  fontSize: z.number().min(8).max(24).default(12),
  startPage: z.number().min(1).default(1),
  prefix: z.string().optional(),
  suffix: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const session = await requireAuth()
    const userId = session.user.id

    // Parse and validate request body
    const body = await request.json()
    const { fileId, format, position, fontSize, startPage, prefix, suffix } =
      pageNumbersSchema.parse(body)

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
        job_type: JobType.PDF_PAGE_NUMBERS,
        input_file_ids: [fileId],
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
        inputFileId: fileId,
        operationType: 'pdf_page_numbers',
        operationParams: { format, position, fontSize, startPage, prefix, suffix },
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
      message: 'PDF page numbering job created successfully',
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    console.error('PDF page numbers error:', error)
    return NextResponse.json(
      { error: 'Failed to create page numbering job' },
      { status: 500 }
    )
  }
}

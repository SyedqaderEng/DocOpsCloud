import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuth } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'
import { enqueueJob } from '@/lib/queue/client'
import { JobPriority, JobType } from '@/lib/queue/types'

const watermarkSchema = z.object({
  fileId: z.string(),
  text: z.string().min(1),
  opacity: z.number().min(0).max(1).default(0.5),
  fontSize: z.number().min(8).max(72).default(48),
  color: z
    .object({
      r: z.number().min(0).max(255),
      g: z.number().min(0).max(255),
      b: z.number().min(0).max(255),
    })
    .default({ r: 128, g: 128, b: 128 }),
  rotation: z.number().default(45),
  position: z.enum(['center', 'diagonal']).default('diagonal'),
})

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const session = await requireAuth()
    const userId = session.user.id

    // Parse and validate request body
    const body = await request.json()
    const { fileId, text, opacity, fontSize, color, rotation, position } =
      watermarkSchema.parse(body)

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
        job_type: JobType.PDF_WATERMARK,
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
        operationType: 'pdf_watermark',
        operationParams: { text, opacity, fontSize, color, rotation, position },
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
      message: 'PDF watermark job created successfully',
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    console.error('PDF watermark error:', error)
    return NextResponse.json(
      { error: 'Failed to create watermark job' },
      { status: 500 }
    )
  }
}

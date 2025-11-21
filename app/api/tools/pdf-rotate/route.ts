import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/db/prisma'
import { checkUsageLimit, logUsage } from '@/lib/usage/usage-service'
import { queueManager } from '@/lib/queue/queue-manager'
import { z } from 'zod'

const rotateSchema = z.object({
  fileId: z.string(),
  rotation: z.enum(['90', '180', '270']),
  pages: z.string().optional(), // "all" or "1,3,5" or "1-5"
})

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const userId = session.user.id

    // 2. Check usage limits
    const usageCheck = await checkUsageLimit(userId)
    if (!usageCheck.allowed) {
      return NextResponse.json(
        { error: 'Usage limit exceeded', tier: usageCheck.tier, limit: usageCheck.limit },
        { status: 429 }
      )
    }

    // 3. Parse and validate request body
    const body = await request.json()
    const { fileId, rotation, pages } = rotateSchema.parse(body)

    // 4. Verify file exists and belongs to user
    const file = await prisma.file.findFirst({
      where: {
        id: fileId,
        user_id: userId,
      },
    })

    if (!file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    // 5. Create processing job
    const job = await prisma.processing_job.create({
      data: {
        user_id: userId,
        operation_type: 'pdf_rotate',
        status: 'queued',
        input_file_ids: [fileId],
        metadata: {
          rotation: parseInt(rotation),
          pages: pages || 'all',
        },
      },
    })

    // 6. Queue job with BullMQ
    await queueManager.addPdfJob({
      jobId: job.id,
      operationType: 'pdf_rotate',
      userId,
      files: [
        {
          id: file.id,
          s3_key: file.s3_key,
          file_name: file.file_name,
        },
      ],
      options: {
        rotation: parseInt(rotation),
        pages: pages || 'all',
      },
    })

    // 7. Log usage
    await logUsage(userId, 'pdf_rotate', 0)

    return NextResponse.json({
      success: true,
      jobId: job.id,
      status: 'queued',
      checkStatusUrl: `/api/jobs/${job.id}`,
      message: `PDF rotation job queued. Rotating by ${rotation}° for pages: ${pages || 'all'}`,
    })
  } catch (error) {
    console.error('PDF rotate error:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to queue PDF rotation' }, { status: 500 })
  }
}

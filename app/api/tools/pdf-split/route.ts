import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db/prisma'
import { checkUsageLimit, logUsage } from '@/lib/usage/limits'
import { queueManager } from '@/lib/queue/client'
import { z } from 'zod'

const splitSchema = z.object({
  fileId: z.string(),
  splitPoints: z.array(z.number()).optional().default([]),
})

/**
 * POST /api/tools/pdf-split
 * Split PDF file into multiple PDFs based on split points
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id

    // Check usage limits
    const usageCheck = await checkUsageLimit(userId)
    if (!usageCheck.allowed) {
      return NextResponse.json(
        {
          error: 'Usage limit exceeded',
          reason: usageCheck.reason,
        },
        { status: 429 }
      )
    }

    // Validate request
    const body = await request.json()
    const { fileId, splitPoints } = splitSchema.parse(body)

    // Verify file
    const file = await prisma.file.findFirst({
      where: {
        id: fileId,
        user_id: userId,
        mime_type: 'application/pdf',
      },
    })

    if (!file) {
      return NextResponse.json(
        { error: 'PDF file not found' },
        { status: 404 }
      )
    }

    // Create processing job
    const job = await prisma.processing_job.create({
      data: {
        user_id: userId,
        operation_type: 'pdf_split',
        status: 'queued',
        input_file_id: fileId,
        metadata: {
          splitPoints,
        },
      },
    })

    // Queue the job with splitPoints (worker will convert to ranges)
    await queueManager.addPdfJob({
      jobId: job.id,
      userId,
      operationType: 'pdf_split',
      inputFileId: fileId,
      operationParams: {
        splitPoints,
      },
    })

    // Log usage
    await logUsage(userId, 'pdf_split', 0)

    return NextResponse.json({
      success: true,
      jobId: job.id,
      status: 'queued',
      message: 'PDF split job queued successfully',
      checkStatusUrl: `/api/jobs/${job.id}`,
    })
  } catch (error) {
    console.error('PDF split error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to split PDF' },
      { status: 500 }
    )
  }
}

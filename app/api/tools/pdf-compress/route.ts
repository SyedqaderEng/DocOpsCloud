import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'
import { checkUsageLimit, logUsage } from '@/lib/usage/limits'
import { queueManager } from '@/lib/queue/client'
import { z } from 'zod'

const compressSchema = z.object({
  fileId: z.string(),
  quality: z.enum(['low', 'medium', 'high']).default('medium'),
})

/**
 * POST /api/tools/pdf-compress
 * Compress PDF file
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

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
    const { fileId, quality } = compressSchema.parse(body)

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
        operation_type: 'pdf_compress',
        status: 'queued',
        input_file_id: fileId,
        metadata: {
          quality,
        },
      },
    })

    // Queue the job
    await queueManager.addPdfJob({
      jobId: job.id,
      userId,
      operationType: 'pdf_compress',
      inputFileId: fileId,
      operationParams: {
        quality,
      },
    })

    // Log usage
    await logUsage(userId, 'pdf_compress', 0)

    return NextResponse.json({
      success: true,
      jobId: job.id,
      status: 'queued',
      message: 'PDF compression job queued successfully',
      checkStatusUrl: `/api/jobs/${job.id}`,
    })
  } catch (error) {
    console.error('PDF compress error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to compress PDF' },
      { status: 500 }
    )
  }
}

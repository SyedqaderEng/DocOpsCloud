import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'
import { checkUsageLimit, logUsage } from '@/lib/usage/limits'
import { queueManager } from '@/lib/queue/client'
import { z } from 'zod'

const mergeSchema = z.object({
  fileIds: z.array(z.string()).min(2, 'At least 2 files required'),
})

/**
 * POST /api/tools/pdf-merge
 * Merge multiple PDF files
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
          remaining: usageCheck.remaining,
        },
        { status: 429 }
      )
    }

    // Validate request
    const body = await request.json()
    const { fileIds } = mergeSchema.parse(body)

    // Verify all files belong to user
    const files = await prisma.file.findMany({
      where: {
        id: { in: fileIds },
        user_id: userId,
      },
    })

    if (files.length !== fileIds.length) {
      return NextResponse.json(
        { error: 'Some files not found or not owned by you' },
        { status: 404 }
      )
    }

    // Verify all are PDFs
    const allPdfs = files.every((f) => f.mime_type === 'application/pdf')
    if (!allPdfs) {
      return NextResponse.json(
        { error: 'All files must be PDFs' },
        { status: 400 }
      )
    }

    // Create processing job
    const job = await prisma.processing_job.create({
      data: {
        user_id: userId,
        operation_type: 'pdf_merge',
        status: 'queued',
        input_file_id: fileIds[0], // Primary file
        metadata: {
          fileIds,
          fileCount: fileIds.length,
        },
      },
    })

    // Queue the job
    await queueManager.addPdfJob({
      jobId: job.id,
      userId,
      operationType: 'pdf_merge',
      inputFileId: fileIds[0],
      operationParams: {
        fileIds,
      },
    })

    // Log usage
    await logUsage(userId, 'pdf_merge', 0)

    return NextResponse.json({
      success: true,
      jobId: job.id,
      status: 'queued',
      message: 'PDF merge job queued successfully',
      checkStatusUrl: `/api/jobs/${job.id}`,
    })
  } catch (error) {
    console.error('PDF merge error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to merge PDFs' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'
import { checkUsageLimit, logUsage } from '@/lib/usage/limits'
import { queueManager } from '@/lib/queue/client'
import { z } from 'zod'

const wordToPdfSchema = z.object({
  fileId: z.string(),
})

/**
 * POST /api/tools/word-to-pdf
 * Convert Word document to PDF
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
    const { fileId } = wordToPdfSchema.parse(body)

    // Verify file
    const file = await prisma.file.findFirst({
      where: {
        id: fileId,
        user_id: userId,
      },
    })

    if (!file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    // Check if it's a Word document
    const isWordDoc =
      file.mime_type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      file.mime_type === 'application/msword'

    if (!isWordDoc) {
      return NextResponse.json(
        { error: 'File must be a Word document (.docx or .doc)' },
        { status: 400 }
      )
    }

    // Create processing job
    const job = await prisma.processing_job.create({
      data: {
        user_id: userId,
        operation_type: 'word_to_pdf',
        status: 'queued',
        input_file_id: fileId,
        metadata: {},
      },
    })

    // Queue the job
    await queueManager.addWordJob({
      jobId: job.id,
      userId,
      operationType: 'word_to_pdf',
      inputFileId: fileId,
      operationParams: {},
    })

    // Log usage
    await logUsage(userId, 'word_to_pdf', 0)

    return NextResponse.json({
      success: true,
      jobId: job.id,
      status: 'queued',
      message: 'Word to PDF conversion job queued successfully',
      checkStatusUrl: `/api/jobs/${job.id}`,
    })
  } catch (error) {
    console.error('Word to PDF error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to convert Word to PDF' },
      { status: 500 }
    )
  }
}

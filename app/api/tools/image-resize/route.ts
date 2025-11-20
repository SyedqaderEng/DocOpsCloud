import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'
import { checkUsageLimit, logUsage } from '@/lib/usage/limits'
import { queueManager } from '@/lib/queue/client'
import { z } from 'zod'

const resizeSchema = z.object({
  fileId: z.string(),
  width: z.number().min(1).optional(),
  height: z.number().min(1).optional(),
  maintainAspectRatio: z.boolean().default(true),
})

/**
 * POST /api/tools/image-resize
 * Resize image
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
    const { fileId, width, height, maintainAspectRatio } = resizeSchema.parse(body)

    if (!width && !height) {
      return NextResponse.json(
        { error: 'Either width or height must be specified' },
        { status: 400 }
      )
    }

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

    // Check if it's an image
    if (!file.mime_type?.startsWith('image/')) {
      return NextResponse.json(
        { error: 'File must be an image' },
        { status: 400 }
      )
    }

    // Create processing job
    const job = await prisma.processing_job.create({
      data: {
        user_id: userId,
        operation_type: 'image_resize',
        status: 'queued',
        input_file_id: fileId,
        metadata: {
          width,
          height,
          maintainAspectRatio,
        },
      },
    })

    // Queue the job
    await queueManager.addImageJob({
      jobId: job.id,
      userId,
      operationType: 'image_resize',
      inputFileId: fileId,
      operationParams: {
        width,
        height,
        maintainAspectRatio,
      },
    })

    // Log usage
    await logUsage(userId, 'image_resize', 0)

    return NextResponse.json({
      success: true,
      jobId: job.id,
      status: 'queued',
      message: 'Image resize job queued successfully',
      checkStatusUrl: `/api/jobs/${job.id}`,
    })
  } catch (error) {
    console.error('Image resize error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to resize image' },
      { status: 500 }
    )
  }
}

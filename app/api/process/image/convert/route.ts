import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'
import { addImageConvertJob } from '@/lib/queue/jobs/image-jobs'
import type { ImageConvertOptions } from '@/modules/image/types'

/**
 * POST /api/process/image/convert
 *
 * Convert image format
 */
export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse request body
    const body = await req.json()
    const { fileId, format, quality, progressive, lossless, effort } = body

    if (!fileId) {
      return NextResponse.json({ error: 'File ID is required' }, { status: 400 })
    }

    if (!format) {
      return NextResponse.json({ error: 'Target format is required' }, { status: 400 })
    }

    // Verify file exists and belongs to user
    const file = await prisma.file.findFirst({
      where: {
        id: fileId,
        userId: session.user.id,
      },
    })

    if (!file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    // Validate file type
    if (!file.mimeType?.includes('image')) {
      return NextResponse.json(
        { error: 'Invalid file type. Only images are supported.' },
        { status: 400 }
      )
    }

    // Create convert options
    const options: ImageConvertOptions = {
      format,
      quality: quality ? parseInt(quality) : 90,
      progressive: progressive ?? false,
      lossless: lossless ?? false,
      effort: effort ? parseInt(effort) : 4,
    }

    // Create job record
    const job = await prisma.job.create({
      data: {
        userId: session.user.id,
        type: 'image_convert',
        status: 'queued',
        inputFileId: fileId,
        metadata: {
          options,
          inputFileName: file.name,
        },
      },
    })

    // Add job to queue
    await addImageConvertJob({
      jobId: job.id,
      userId: session.user.id,
      inputS3Key: file.s3Key,
      options,
    })

    return NextResponse.json({
      jobId: job.id,
      status: 'queued',
      message: 'Image conversion job created',
    })
  } catch (error) {
    console.error('Image convert API error:', error)
    return NextResponse.json(
      { error: 'Failed to create conversion job' },
      { status: 500 }
    )
  }
}

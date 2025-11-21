import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/db/prisma'
import { checkUsageLimit, logUsage } from '@/lib/usage/usage-service'
import { queueManager } from '@/lib/queue/queue-manager'
import { z } from 'zod'

const IMAGE_EXTENSIONS = /\.(jpg|jpeg|png|gif|webp|avif|tiff?)$/i
const schema = z.object({ fileId: z.string(), quality: z.number().min(1).max(100).optional(), stripMetadata: z.boolean().optional() })

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const userId = session.user.id

    const usageCheck = await checkUsageLimit(userId)
    if (!usageCheck.allowed) return NextResponse.json({ error: 'Usage limit exceeded' }, { status: 429 })

    const body = await request.json()
    const { fileId, quality, stripMetadata } = schema.parse(body)

    const file = await prisma.file.findFirst({ where: { id: fileId, user_id: userId } })
    if (!file) return NextResponse.json({ error: 'File not found' }, { status: 404 })
    if (!file.file_name.match(IMAGE_EXTENSIONS)) return NextResponse.json({ error: 'Raster images only (no SVG)' }, { status: 400 })

    const job = await prisma.processing_job.create({
      data: { user_id: userId, operation_type: 'image_optimize', status: 'queued', input_file_ids: [fileId], metadata: { quality: quality ?? 80, stripMetadata: stripMetadata ?? true } },
    })

    await queueManager.addImageJob({
      jobId: job.id, operationType: 'image_optimize', userId,
      files: [{ id: file.id, s3_key: file.s3_key, file_name: file.file_name }],
      options: { quality: quality ?? 80, stripMetadata: stripMetadata ?? true },
    })

    await logUsage(userId, 'image_optimize', 0)
    return NextResponse.json({ success: true, jobId: job.id, checkStatusUrl: `/api/jobs/${job.id}` })
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    return NextResponse.json({ error: 'Failed to queue optimization' }, { status: 500 })
  }
}

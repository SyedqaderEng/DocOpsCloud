import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/db/prisma'
import { checkUsageLimit, logUsage } from '@/lib/usage/usage-service'
import { queueManager } from '@/lib/queue/queue-manager'
import { z } from 'zod'

const IMAGE_EXTENSIONS = /\.(jpg|jpeg|png|gif|webp|avif|tiff?|svg)$/i
const schema = z.object({
  fileId: z.string(),
  width: z.number().min(1).max(500),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const userId = session.user.id

    const usageCheck = await checkUsageLimit(userId)
    if (!usageCheck.allowed) return NextResponse.json({ error: 'Usage limit exceeded' }, { status: 429 })

    const body = await request.json()
    const { fileId, width, color } = schema.parse(body)

    const file = await prisma.file.findFirst({ where: { id: fileId, user_id: userId } })
    if (!file) return NextResponse.json({ error: 'File not found' }, { status: 404 })
    if (!file.file_name.match(IMAGE_EXTENSIONS)) return NextResponse.json({ error: 'Images only' }, { status: 400 })

    const job = await prisma.processing_job.create({
      data: { user_id: userId, operation_type: 'image_border', status: 'queued', input_file_ids: [fileId], metadata: { width, color: color || '#000000' } },
    })

    await queueManager.addImageJob({
      jobId: job.id, operationType: 'image_border', userId,
      files: [{ id: file.id, s3_key: file.s3_key, file_name: file.file_name }],
      options: { width, color: color || '#000000' },
    })

    await logUsage(userId, 'image_border', 0)
    return NextResponse.json({ success: true, jobId: job.id, checkStatusUrl: `/api/jobs/${job.id}` })
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    return NextResponse.json({ error: 'Failed to queue border addition' }, { status: 500 })
  }
}

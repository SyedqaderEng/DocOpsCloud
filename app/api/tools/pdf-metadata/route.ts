import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/db/prisma'
import { checkUsageLimit, logUsage } from '@/lib/usage/usage-service'
import { queueManager } from '@/lib/queue/queue-manager'
import { z } from 'zod'

const metadataSchema = z.object({
  fileId: z.string(),
  title: z.string().optional(),
  author: z.string().optional(),
  subject: z.string().optional(),
  keywords: z.string().optional(),
  creator: z.string().optional(),
  producer: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const userId = session.user.id

    const usageCheck = await checkUsageLimit(userId)
    if (!usageCheck.allowed) {
      return NextResponse.json(
        { error: 'Usage limit exceeded', tier: usageCheck.tier, limit: usageCheck.limit },
        { status: 429 }
      )
    }

    const body = await request.json()
    const { fileId, title, author, subject, keywords, creator, producer } = metadataSchema.parse(body)

    const file = await prisma.file.findFirst({
      where: { id: fileId, user_id: userId },
    })

    if (!file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    const metadata: Record<string, string> = {}
    if (title) metadata.title = title
    if (author) metadata.author = author
    if (subject) metadata.subject = subject
    if (keywords) metadata.keywords = keywords
    if (creator) metadata.creator = creator
    if (producer) metadata.producer = producer

    const job = await prisma.processing_job.create({
      data: {
        user_id: userId,
        operation_type: 'pdf_metadata',
        status: 'queued',
        input_file_ids: [fileId],
        metadata,
      },
    })

    await queueManager.addPdfJob({
      jobId: job.id,
      operationType: 'pdf_metadata',
      userId,
      files: [{ id: file.id, s3_key: file.s3_key, file_name: file.file_name }],
      options: { metadata },
    })

    await logUsage(userId, 'pdf_metadata', 0)

    return NextResponse.json({
      success: true,
      jobId: job.id,
      status: 'queued',
      checkStatusUrl: `/api/jobs/${job.id}`,
      message: 'PDF metadata update job queued',
    })
  } catch (error) {
    console.error('PDF metadata error:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to queue PDF metadata update' }, { status: 500 })
  }
}

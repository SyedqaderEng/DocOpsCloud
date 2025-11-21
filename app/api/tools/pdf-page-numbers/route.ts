import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/db/prisma'
import { checkUsageLimit, logUsage } from '@/lib/usage/usage-service'
import { queueManager } from '@/lib/queue/queue-manager'
import { z } from 'zod'

const pageNumbersSchema = z.object({
  fileId: z.string(),
  position: z.enum(['top-center', 'top-left', 'top-right', 'bottom-center', 'bottom-left', 'bottom-right']).optional(),
  format: z.string().optional(), // e.g. "Page {n} of {total}" or "{n}"
  startPage: z.number().min(1).optional(),
  fontSize: z.number().min(8).max(24).optional(),
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
    const { fileId, position, format, startPage, fontSize } = pageNumbersSchema.parse(body)

    const file = await prisma.file.findFirst({
      where: { id: fileId, user_id: userId },
    })

    if (!file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    const job = await prisma.processing_job.create({
      data: {
        user_id: userId,
        operation_type: 'pdf_page_numbers',
        status: 'queued',
        input_file_ids: [fileId],
        metadata: {
          position: position || 'bottom-center',
          format: format || '{n}',
          startPage: startPage || 1,
          fontSize: fontSize || 12,
        },
      },
    })

    await queueManager.addPdfJob({
      jobId: job.id,
      operationType: 'pdf_page_numbers',
      userId,
      files: [{ id: file.id, s3_key: file.s3_key, file_name: file.file_name }],
      options: {
        position: position || 'bottom-center',
        format: format || '{n}',
        startPage: startPage || 1,
        fontSize: fontSize || 12,
      },
    })

    await logUsage(userId, 'pdf_page_numbers', 0)

    return NextResponse.json({
      success: true,
      jobId: job.id,
      status: 'queued',
      checkStatusUrl: `/api/jobs/${job.id}`,
      message: 'PDF page numbering job queued',
    })
  } catch (error) {
    console.error('PDF page numbers error:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to queue PDF page numbering' }, { status: 500 })
  }
}

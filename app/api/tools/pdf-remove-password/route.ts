import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/db/prisma'
import { checkUsageLimit, logUsage } from '@/lib/usage/usage-service'
import { queueManager } from '@/lib/queue/queue-manager'
import { z } from 'zod'

const removePasswordSchema = z.object({
  fileId: z.string(),
  password: z.string().min(1, 'Current password is required'),
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
    const { fileId, password } = removePasswordSchema.parse(body)

    const file = await prisma.file.findFirst({
      where: { id: fileId, user_id: userId },
    })

    if (!file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    const job = await prisma.processing_job.create({
      data: {
        user_id: userId,
        operation_type: 'pdf_remove_password',
        status: 'queued',
        input_file_ids: [fileId],
        metadata: {},
      },
    })

    await queueManager.addPdfJob({
      jobId: job.id,
      operationType: 'pdf_remove_password',
      userId,
      files: [{ id: file.id, s3_key: file.s3_key, file_name: file.file_name }],
      options: {
        password,
      },
    })

    await logUsage(userId, 'pdf_remove_password', 0)

    return NextResponse.json({
      success: true,
      jobId: job.id,
      status: 'queued',
      checkStatusUrl: `/api/jobs/${job.id}`,
      message: 'PDF password removal job queued',
    })
  } catch (error) {
    console.error('PDF remove password error:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to queue PDF password removal' }, { status: 500 })
  }
}

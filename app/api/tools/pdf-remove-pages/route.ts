import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/db/prisma'
import { checkUsageLimit, logUsage } from '@/lib/usage/usage-service'
import { queueManager } from '@/lib/queue/queue-manager'
import { z } from 'zod'

const schema = z.object({ fileId: z.string(), pages: z.array(z.number().positive()) })

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const userId = session.user.id

    const usageCheck = await checkUsageLimit(userId)
    if (!usageCheck.allowed) return NextResponse.json({ error: 'Usage limit exceeded' }, { status: 429 })

    const body = await request.json()
    const { fileId, pages } = schema.parse(body)

    const file = await prisma.file.findFirst({ where: { id: fileId, user_id: userId } })
    if (!file) return NextResponse.json({ error: 'File not found' }, { status: 404 })
    if (!file.file_name.match(/\.pdf$/i)) return NextResponse.json({ error: 'PDF files only' }, { status: 400 })

    const job = await prisma.processing_job.create({
      data: { user_id: userId, operation_type: 'pdf_remove_pages', status: 'queued', input_file_ids: [fileId], metadata: { pages } },
    })

    await queueManager.addPdfJob({
      jobId: job.id, operationType: 'pdf_remove_pages', userId,
      files: [{ id: file.id, s3_key: file.s3_key, file_name: file.file_name }],
      options: { pages },
    })

    await logUsage(userId, 'pdf_remove_pages', 0)
    return NextResponse.json({ success: true, jobId: job.id, checkStatusUrl: `/api/jobs/${job.id}` })
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    return NextResponse.json({ error: 'Failed to queue page removal' }, { status: 500 })
  }
}

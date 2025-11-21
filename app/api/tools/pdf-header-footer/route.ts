import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/db/prisma'
import { checkUsageLimit, logUsage } from '@/lib/usage/usage-service'
import { queueManager } from '@/lib/queue/queue-manager'
import { z } from 'zod'

const schema = z.object({
  fileId: z.string(),
  header: z.string().optional(),
  footer: z.string().optional(),
  fontSize: z.number().min(6).max(72).optional(),
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const userId = session.user.id

    const usageCheck = await checkUsageLimit(userId)
    if (!usageCheck.allowed) return NextResponse.json({ error: 'Usage limit exceeded' }, { status: 429 })

    const body = await request.json()
    const { fileId, header, footer, fontSize } = schema.parse(body)

    if (!header && !footer) return NextResponse.json({ error: 'Header or footer text required' }, { status: 400 })

    const file = await prisma.file.findFirst({ where: { id: fileId, user_id: userId } })
    if (!file) return NextResponse.json({ error: 'File not found' }, { status: 404 })
    if (!file.file_name.match(/\.pdf$/i)) return NextResponse.json({ error: 'PDF files only' }, { status: 400 })

    const job = await prisma.processing_job.create({
      data: { user_id: userId, operation_type: 'pdf_header_footer', status: 'queued', input_file_ids: [fileId], metadata: { header, footer, fontSize: fontSize || 12 } },
    })

    await queueManager.addPdfJob({
      jobId: job.id, operationType: 'pdf_header_footer', userId,
      files: [{ id: file.id, s3_key: file.s3_key, file_name: file.file_name }],
      options: { header, footer, fontSize: fontSize || 12 },
    })

    await logUsage(userId, 'pdf_header_footer', 0)
    return NextResponse.json({ success: true, jobId: job.id, checkStatusUrl: `/api/jobs/${job.id}` })
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    return NextResponse.json({ error: 'Failed to queue header/footer addition' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/db/prisma'
import { checkUsageLimit, logUsage } from '@/lib/usage/usage-service'
import { queueManager } from '@/lib/queue/queue-manager'
import { z } from 'zod'

const schema = z.object({ fileId: z.string(), sheetName: z.string().optional() })

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const userId = session.user.id

    const usageCheck = await checkUsageLimit(userId)
    if (!usageCheck.allowed) return NextResponse.json({ error: 'Usage limit exceeded' }, { status: 429 })

    const body = await request.json()
    const { fileId, sheetName } = schema.parse(body)

    const file = await prisma.file.findFirst({ where: { id: fileId, user_id: userId } })
    if (!file) return NextResponse.json({ error: 'File not found' }, { status: 404 })

    if (!file.file_name.match(/\.xlsx?$/i)) {
      return NextResponse.json({ error: 'Only Excel files (.xlsx, .xls) supported' }, { status: 400 })
    }

    const job = await prisma.processing_job.create({
      data: {
        user_id: userId, operation_type: 'excel_to_xml', status: 'queued',
        input_file_ids: [fileId], metadata: { sheetName },
      },
    })

    await queueManager.addExcelJob({
      jobId: job.id, operationType: 'excel_to_xml', userId,
      files: [{ id: file.id, s3_key: file.s3_key, file_name: file.file_name }],
      options: { sheetName },
    })

    await logUsage(userId, 'excel_to_xml', 0)
    return NextResponse.json({ success: true, jobId: job.id, checkStatusUrl: `/api/jobs/${job.id}` })
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    return NextResponse.json({ error: 'Failed to queue conversion' }, { status: 500 })
  }
}

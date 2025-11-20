import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/auth/session'
import { addJob } from '@/lib/queue/jobs'
import { ProcessingJobData } from '@/lib/queue/types'
import { prisma } from '@/lib/db/prisma'
import { z } from 'zod'

const createJobSchema = z.object({
  inputFileId: z.string().cuid(),
  operationType: z.string(),
  operationParams: z.record(z.any()).optional(),
})

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser()

    const body = await req.json()
    const validated = createJobSchema.safeParse(body)

    if (!validated.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validated.error.errors },
        { status: 400 }
      )
    }

    const { inputFileId, operationType, operationParams } = validated.data

    // Verify file exists and belongs to user
    const file = await prisma.file.findFirst({
      where: {
        id: inputFileId,
        user_id: user.id,
      },
    })

    if (!file) {
      return NextResponse.json(
        { error: 'File not found or access denied' },
        { status: 404 }
      )
    }

    // Create job record in database
    const jobRecord = await prisma.processingJob.create({
      data: {
        user_id: user.id,
        input_file_id: inputFileId,
        operation_type: operationType,
        operation_params: operationParams || {},
        status: 'QUEUED',
        progress_percentage: 0,
      },
    })

    // Prepare job data
    const jobData: ProcessingJobData = {
      jobId: jobRecord.id,
      userId: user.id,
      inputFileId,
      operationType,
      operationParams,
      subscriptionTier: user.subscription_tier,
    }

    // Determine queue based on operation type
    let queueName: 'PDF' | 'WORD' | 'EXCEL' | 'IMAGE' | 'GENERAL' = 'GENERAL'

    if (operationType.startsWith('pdf_')) {
      queueName = 'PDF'
    } else if (operationType.startsWith('word_')) {
      queueName = 'WORD'
    } else if (operationType.startsWith('excel_') || operationType.startsWith('csv_')) {
      queueName = 'EXCEL'
    } else if (operationType.startsWith('image_')) {
      queueName = 'IMAGE'
    }

    // Add job to queue
    await addJob(queueName, jobData)

    return NextResponse.json({
      success: true,
      data: {
        jobId: jobRecord.id,
        status: jobRecord.status,
      },
    })
  } catch (error) {
    console.error('Job creation error:', error)

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json({ error: 'Failed to create job' }, { status: 500 })
  }
}

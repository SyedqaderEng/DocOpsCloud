import { NextRequest, NextResponse } from 'next/server'
import { enforcePlanLimits, createPlanLimitResponse, recordOperation } from '@/lib/middleware/plan-enforcement'
import { auth } from '@/lib/firebase/admin'
import { prisma } from '@/lib/db/prisma'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { v4 as uuidv4 } from 'uuid'
import { pdfQueue } from '@/lib/queue/client'

export const config = {
  api: {
    bodyParser: false,
  },
}

export async function POST(req: NextRequest) {
  const startTime = Date.now()

  try {
    // 1. ENFORCE PLAN LIMITS
    const enforcement = await enforcePlanLimits(req)
    if (!enforcement.allowed) {
      return createPlanLimitResponse(enforcement)
    }

    // 2. GET USER INFO
    const authHeader = req.headers.get('authorization')
    const token = authHeader?.split('Bearer ')[1]
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decodedToken = await auth.verifyIdToken(token)
    const user = await prisma.user.findFirst({
      where: { email: decodedToken.email },
      select: { id: true, subscription_tier: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // 3. PARSE FORM DATA
    const formData = await req.formData()
    const files = formData.getAll('files') as File[]
    const toolId = formData.get('toolId') as string

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files uploaded' }, { status: 400 })
    }

    if (!toolId) {
      return NextResponse.json({ error: 'Tool ID required' }, { status: 400 })
    }

    // 4. VALIDATE FILE SIZES AGAIN (server-side)
    const totalSize = files.reduce((sum, file) => sum + file.size, 0)
    const fileSizeEnforcement = await enforcePlanLimits(req, {
      operationType: toolId,
      fileSize: totalSize,
    })

    if (!fileSizeEnforcement.allowed) {
      return createPlanLimitResponse(fileSizeEnforcement)
    }

    // 5. CREATE TEMP DIRECTORY FOR UPLOADS
    const uploadDir = join(process.cwd(), 'temp', 'uploads', uuidv4())
    await mkdir(uploadDir, { recursive: true })

    // 6. SAVE FILES TO TEMP DIRECTORY
    const savedFiles = await Promise.all(
      files.map(async (file) => {
        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)
        const filename = `${uuidv4()}-${file.name}`
        const filepath = join(uploadDir, filename)
        await writeFile(filepath, buffer)
        return {
          originalName: file.name,
          filename,
          filepath,
          size: file.size,
          type: file.type,
        }
      })
    )

    // 7. CREATE JOB RECORD IN DATABASE
    const job = await prisma.processingJob.create({
      data: {
        user_id: user.id,
        operation_type: toolId,
        status: 'QUEUED',
        operation_params: {
          files: savedFiles.map(f => ({
            originalName: f.originalName,
            filepath: f.filepath,
            size: f.size,
            type: f.type,
          })),
          uploadDir,
        },
        // We'll create input file records separately
        input_file_id: '', // Placeholder, will update
      },
    })

    // 8. ADD JOB TO PROCESSING QUEUE
    try {
      await pdfQueue.add(
        `process-${toolId}`,
        {
          jobId: job.id,
          userId: user.id,
          toolId,
          files: savedFiles,
          uploadDir,
          tier: user.subscription_tier,
        },
        {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
          removeOnComplete: false,
          removeOnFail: false,
        }
      )
    } catch (queueError) {
      console.error('Failed to add job to queue:', queueError)
      // If queue fails, mark job as failed but continue
      await prisma.processingJob.update({
        where: { id: job.id },
        data: { status: 'FAILED', error_message: 'Failed to queue job' },
      })
    }

    // 9. RECORD OPERATION FOR USAGE TRACKING
    await recordOperation(
      user.id,
      toolId,
      totalSize,
      Date.now() - startTime
    )

    // 10. RETURN SUCCESS RESPONSE
    return NextResponse.json({
      success: true,
      jobId: job.id,
      status: 'queued',
      message: 'Files uploaded and queued for processing',
      filesCount: files.length,
      estimatedTime: files.length * 5, // Rough estimate: 5 seconds per file
    })
  } catch (error: any) {
    console.error('Upload processing error:', error)
    return NextResponse.json(
      {
        error: error.message || 'Failed to process upload',
        code: 'PROCESSING_ERROR',
      },
      { status: 500 }
    )
  }
}

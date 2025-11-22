import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/firebase/admin'
import { prisma } from '@/lib/db/prisma'
import { readFile } from 'fs/promises'
import { join } from 'path'

interface RouteParams {
  params: Promise<{ jobId: string }>
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { jobId } = await params

    // Get authorization token (optional for download - could use signed URLs instead)
    const authHeader = req.headers.get('authorization')

    let userId: string | null = null

    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.split('Bearer ')[1]
      try {
        const decodedToken = await auth.verifyIdToken(token)
        const user = await prisma.user.findFirst({
          where: { email: decodedToken.email },
          select: { id: true },
        })
        userId = user?.id || null
      } catch (err) {
        // Token invalid, continue without auth
      }
    }

    // Get job details
    const job = await prisma.processingJob.findUnique({
      where: { id: jobId },
      include: {
        output_file: true,
      },
    })

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    // Verify job belongs to user (if authenticated)
    if (userId && job.user_id !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Check if job is complete
    if (job.status !== 'COMPLETE') {
      return NextResponse.json(
        { error: `Job is not complete. Status: ${job.status}` },
        { status: 400 }
      )
    }

    if (!job.output_file) {
      return NextResponse.json(
        { error: 'Output file not found' },
        { status: 404 }
      )
    }

    // Get file path from job params
    const params_data = job.operation_params as any
    const uploadDir = params_data?.uploadDir

    if (!uploadDir) {
      return NextResponse.json(
        { error: 'File location not found' },
        { status: 404 }
      )
    }

    // Read the output file
    const outputFilePath = join(uploadDir, job.output_file.stored_name)

    try {
      const fileBuffer = await readFile(outputFilePath)

      // Return file as download
      return new NextResponse(fileBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${job.output_file.original_name}"`,
          'Content-Length': fileBuffer.length.toString(),
        },
      })
    } catch (fileError) {
      console.error('File read error:', fileError)
      return NextResponse.json(
        { error: 'File no longer available' },
        { status: 410 } // Gone
      )
    }
  } catch (error) {
    console.error('Download error:', error)
    return NextResponse.json(
      { error: 'Failed to download file' },
      { status: 500 }
    )
  }
}

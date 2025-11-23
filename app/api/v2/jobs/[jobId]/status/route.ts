/**
 * Universal Job Status Endpoint
 * GET /api/v2/jobs/[jobId]/status
 * Check status of ANY job
 */

import { NextRequest, NextResponse } from 'next/server'
import { workflowService } from '@/lib/services/workflow.service'

export async function GET(
  _req: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const { jobId } = params

    const status = await workflowService.getJobStatus(jobId)

    return NextResponse.json({
      jobId: status.jobId,
      status: status.status,
      progress: status.progress,
      ...(status.outputFileId && {
        outputFileId: status.outputFileId,
        downloadUrl: status.downloadUrl,
      }),
      ...(status.error && {
        error: status.error,
      }),
    })
  } catch (error: any) {
    console.error('[Job/Status] Error:', error)

    if (error.message.includes('not found')) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: error.message || 'Failed to get job status' },
      { status: 500 }
    )
  }
}

/**
 * DELETE endpoint to cancel a job
 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const { jobId } = params

    await workflowService.cancelJob(jobId)

    return NextResponse.json({
      success: true,
      message: 'Job cancelled',
    })
  } catch (error: any) {
    console.error('[Job/Cancel] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to cancel job' },
      { status: 500 }
    )
  }
}

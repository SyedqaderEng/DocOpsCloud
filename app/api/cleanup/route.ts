import { NextRequest, NextResponse } from 'next/server'
import { runCleanupJobs } from '@/lib/storage/cleanup'

// This endpoint should be called by a cron job
// In production, secure this with an API key or secret token
export async function POST(req: NextRequest) {
  try {
    // Check for authorization (optional - add secret token in production)
    const authHeader = req.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Run cleanup jobs
    const result = await runCleanupJobs()

    return NextResponse.json({
      success: true,
      data: result,
    })
  } catch (error) {
    console.error('Cleanup job error:', error)

    return NextResponse.json(
      {
        error: 'Cleanup job failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// Also allow GET for manual triggering in development
export async function GET(req: NextRequest) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not allowed in production' }, { status: 403 })
  }

  return POST(req)
}

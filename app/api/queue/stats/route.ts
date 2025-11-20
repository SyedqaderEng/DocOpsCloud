import { NextRequest, NextResponse } from 'next/server'
import { getAllQueueStats } from '@/lib/queue/jobs'

// This endpoint can be used for monitoring/admin purposes
// In production, secure this with admin authentication
export async function GET(req: NextRequest) {
  try {
    // TODO: Add admin authentication check

    const stats = await getAllQueueStats()

    return NextResponse.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Queue stats error:', error)

    return NextResponse.json(
      { error: 'Failed to fetch queue stats' },
      { status: 500 }
    )
  }
}

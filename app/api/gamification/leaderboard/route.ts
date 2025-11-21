import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { getLeaderboard } from '@/lib/gamification/service'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const period = (searchParams.get('period') || 'ALL_TIME') as 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'ALL_TIME'
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 100)

    const leaderboard = await getLeaderboard(period, limit)

    // Find current user's rank
    const userRank = leaderboard.findIndex(u => u.userId === session.user.id)

    return NextResponse.json({
      success: true,
      data: {
        leaderboard,
        userRank: userRank >= 0 ? userRank + 1 : null,
        period,
      },
    })
  } catch (error) {
    console.error('Leaderboard error:', error)
    return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 })
  }
}

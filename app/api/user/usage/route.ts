import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/firebase/admin'
import { UsageTracker } from '@/lib/services/usage-tracker'
import { prisma } from '@/lib/db/prisma'

export async function GET(req: NextRequest) {
  try {
    // Get authorization token
    const authHeader = req.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing authorization token' },
        { status: 401 }
      )
    }

    const token = authHeader.split('Bearer ')[1]

    // Verify Firebase token
    const decodedToken = await auth.verifyIdToken(token)

    // Get user from database
    const user = await prisma.user.findFirst({
      where: {
        email: decodedToken.email,
      },
      select: {
        id: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Get usage stats
    const stats = await UsageTracker.getUsageStats(user.id)

    return NextResponse.json({ usage: stats })
  } catch (error) {
    console.error('Error fetching usage stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch usage stats' },
      { status: 500 }
    )
  }
}

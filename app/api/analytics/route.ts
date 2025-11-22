import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'

/**
 * GET /api/analytics
 * Get user analytics and statistics
 */
export async function GET(req: NextRequest) {
  try {
    const user = await requireUser()
    const { searchParams } = new URL(req.url)
    const period = searchParams.get('period') || '30days' // 7days, 30days, 90days, all

    // Calculate date range
    const now = new Date()
    const startDate = getStartDate(period)

    // Get total files uploaded
    const totalFiles = await prisma.file.count({
      where: {
        user_id: user.id,
        created_at: { gte: startDate },
      },
    })

    // Get total jobs
    const totalJobs = await prisma.processingJob.count({
      where: {
        user_id: user.id,
        created_at: { gte: startDate },
      },
    })

    // Get jobs by status
    const jobsByStatus = await prisma.processingJob.groupBy({
      by: ['status'],
      where: {
        user_id: user.id,
        created_at: { gte: startDate },
      },
      _count: true,
    })

    // Get files by type
    const filesByType = await prisma.file.groupBy({
      by: ['file_type'],
      where: {
        user_id: user.id,
        created_at: { gte: startDate },
      },
      _count: true,
    })

    // Get most used operations
    const operationCounts = await prisma.processingJob.groupBy({
      by: ['operation_type'],
      where: {
        user_id: user.id,
        created_at: { gte: startDate },
      },
      _count: true,
      orderBy: {
        _count: {
          operation_type: 'desc',
        },
      },
      take: 10,
    })

    // Get total storage used
    const storageStats = await prisma.file.aggregate({
      where: {
        user_id: user.id,
      },
      _sum: {
        file_size: true,
      },
    })

    // Get share link statistics
    const totalShares = await prisma.shareLink.count({
      where: { user_id: user.id },
    })

    const activeShares = await prisma.shareLink.count({
      where: {
        user_id: user.id,
        expires_at: { gte: now },
      },
    })

    const totalViews = await prisma.shareLink.aggregate({
      where: { user_id: user.id },
      _sum: {
        current_views: true,
      },
    })

    // Get daily activity for the period
    const dailyActivity = await getDailyActivity(user.id, startDate)

    // Calculate success rate
    const successRate =
      totalJobs > 0
        ? Math.round(
            ((jobsByStatus.find((s) => s.status === 'COMPLETE')?._count || 0) / totalJobs) * 100
          )
        : 0

    // Get processing time statistics
    const avgProcessingTime = await getAverageProcessingTime(user.id, startDate)

    // Get file version statistics
    const totalVersions = await prisma.fileVersion.count({
      where: {
        user_id: user.id,
        created_at: { gte: startDate },
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        period,
        overview: {
          totalFiles,
          totalJobs,
          totalShares,
          activeShares,
          totalViews: totalViews._sum.current_views || 0,
          totalVersions,
          successRate,
          avgProcessingTime,
        },
        jobsByStatus: jobsByStatus.map((item) => ({
          status: item.status,
          count: item._count,
        })),
        filesByType: filesByType.map((item) => ({
          type: item.file_type,
          count: item._count,
        })),
        topOperations: operationCounts.map((item) => ({
          operation: item.operation_type,
          count: item._count,
        })),
        storage: {
          totalUsed: Number(storageStats._sum.file_size || 0),
          // You can add tier limits here based on user subscription
        },
        dailyActivity,
      },
    })
  } catch (error) {
    console.error('Analytics error:', error)

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 })
  }
}

/**
 * Get start date based on period
 */
function getStartDate(period: string): Date {
  const now = new Date()

  switch (period) {
    case '7days':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    case '30days':
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    case '90days':
      return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
    case 'all':
      return new Date(0) // Beginning of time
    default:
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  }
}

/**
 * Get daily activity breakdown
 */
async function getDailyActivity(userId: string, startDate: Date) {
  const jobs = await prisma.processingJob.findMany({
    where: {
      user_id: userId,
      created_at: { gte: startDate },
    },
    select: {
      created_at: true,
      status: true,
    },
    orderBy: {
      created_at: 'asc',
    },
  })

  // Group by date
  const activityMap = new Map<string, { date: string; jobs: number; completed: number }>()

  jobs.forEach((job) => {
    const dateKey = job.created_at.toISOString().split('T')[0]

    if (!activityMap.has(dateKey)) {
      activityMap.set(dateKey, { date: dateKey, jobs: 0, completed: 0 })
    }

    const activity = activityMap.get(dateKey)!
    activity.jobs++
    if (job.status === 'COMPLETE') {
      activity.completed++
    }
  })

  return Array.from(activityMap.values())
}

/**
 * Calculate average processing time
 */
async function getAverageProcessingTime(userId: string, startDate: Date): Promise<number> {
  const completedJobs = await prisma.processingJob.findMany({
    where: {
      user_id: userId,
      status: 'COMPLETE',
      created_at: { gte: startDate },
      started_at: { not: null },
      completed_at: { not: null },
    },
    select: {
      started_at: true,
      completed_at: true,
    },
  })

  if (completedJobs.length === 0) return 0

  const totalTime = completedJobs.reduce((sum, job) => {
    if (job.started_at && job.completed_at) {
      return sum + (job.completed_at.getTime() - job.started_at.getTime())
    }
    return sum
  }, 0)

  return Math.round(totalTime / completedJobs.length / 1000) // Return in seconds
}

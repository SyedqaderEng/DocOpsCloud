import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'

/**
 * GET /api/dashboard/stats
 * Returns dashboard statistics for the current user
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id

    // Get current month boundaries
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    // Parallel queries for performance
    const [
      totalFiles,
      jobsThisMonth,
      completedJobs,
      processingJobs,
      recentActivity,
      storageUsed,
      usageStats,
    ] = await Promise.all([
      // Total files count
      prisma.file.count({
        where: { user_id: userId },
      }),

      // Jobs this month
      prisma.processing_job.count({
        where: {
          user_id: userId,
          created_at: { gte: startOfMonth },
        },
      }),

      // Completed jobs
      prisma.processing_job.count({
        where: {
          user_id: userId,
          status: 'completed',
        },
      }),

      // Processing jobs
      prisma.processing_job.count({
        where: {
          user_id: userId,
          status: { in: ['queued', 'processing'] },
        },
      }),

      // Recent activity (last 5 jobs)
      prisma.processing_job.findMany({
        where: { user_id: userId },
        orderBy: { created_at: 'desc' },
        take: 5,
        select: {
          id: true,
          operation_type: true,
          status: true,
          created_at: true,
          completed_at: true,
          metadata: true,
        },
      }),

      // Total storage used (sum of all file sizes)
      prisma.file.aggregate({
        where: { user_id: userId },
        _sum: { size: true },
      }),

      // Usage this month
      prisma.usage_log.count({
        where: {
          user_id: userId,
          created_at: { gte: startOfMonth },
        },
      }),
    ])

    // Format storage size
    const storageBytes = Number(storageUsed._sum.size || 0)
    const storageGB = (storageBytes / (1024 * 1024 * 1024)).toFixed(2)

    return NextResponse.json({
      stats: {
        totalFiles,
        jobsThisMonth,
        completedJobs,
        processingJobs,
        storageUsed: storageGB,
        usageThisMonth: usageStats,
      },
      recentActivity: recentActivity.map((job) => ({
        id: job.id,
        type: job.operation_type,
        status: job.status,
        createdAt: job.created_at,
        completedAt: job.completed_at,
        metadata: job.metadata as any,
      })),
    })
  } catch (error) {
    console.error('Dashboard stats error:', error)
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/firebase/admin'
import { prisma } from '@/lib/db/prisma'

/**
 * GET /api/dashboard/stats
 * Returns dashboard statistics for the current user
 * Requires Firebase Auth token in Authorization header
 */
export async function GET(req: NextRequest) {
  try {
    // Get authorization token
    const authHeader = req.headers.get('authorization')

    // If no auth header, return empty stats (for public pages)
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({
        stats: {
          totalFiles: 0,
          jobsThisMonth: 0,
          completedJobs: 0,
          processingJobs: 0,
          storageUsed: '0',
          usageThisMonth: 0,
        },
        recentActivity: [],
      })
    }

    const token = authHeader.split('Bearer ')[1]

    // Verify Firebase token
    let decodedToken
    try {
      decodedToken = await auth.verifyIdToken(token)
    } catch (authError) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Get user from database
    const user = await prisma.user.findFirst({
      where: { email: decodedToken.email },
      select: { id: true },
    })

    if (!user) {
      // User not in database yet, return empty stats
      return NextResponse.json({
        stats: {
          totalFiles: 0,
          jobsThisMonth: 0,
          completedJobs: 0,
          processingJobs: 0,
          storageUsed: '0',
          usageThisMonth: 0,
        },
        recentActivity: [],
      })
    }

    const userId = user.id

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
      prisma.processingJob.count({
        where: {
          user_id: userId,
          created_at: { gte: startOfMonth },
        },
      }),

      // Completed jobs
      prisma.processingJob.count({
        where: {
          user_id: userId,
          status: 'COMPLETE',
        },
      }),

      // Processing jobs
      prisma.processingJob.count({
        where: {
          user_id: userId,
          status: { in: ['QUEUED', 'PROCESSING'] },
        },
      }),

      // Recent activity (last 10 jobs)
      prisma.processingJob.findMany({
        where: { user_id: userId },
        orderBy: { created_at: 'desc' },
        take: 10,
        select: {
          id: true,
          operation_type: true,
          status: true,
          created_at: true,
          completed_at: true,
          operation_params: true,
        },
      }),

      // Total storage used (sum of all file sizes)
      prisma.file.aggregate({
        where: { user_id: userId },
        _sum: { file_size: true },
      }),

      // Usage this month
      prisma.usageLog.count({
        where: {
          user_id: userId,
          created_at: { gte: startOfMonth },
        },
      }),
    ])

    // Format storage size
    const storageBytes = Number(storageUsed._sum.file_size || 0)
    const storageGB = (storageBytes / (1024 * 1024 * 1024)).toFixed(2)

    return NextResponse.json({
      stats: {
        totalFiles,
        jobsThisMonth,
        completedJobs,
        processingJobs,
        storageUsed: `${storageGB} GB`,
        usageThisMonth: usageStats,
      },
      recentActivity: recentActivity.map((job) => ({
        id: job.id,
        type: job.operation_type,
        status: job.status.toLowerCase(),
        createdAt: job.created_at.toISOString(),
        completedAt: job.completed_at?.toISOString() || null,
        metadata: job.operation_params as any,
      })),
    })
  } catch (error) {
    console.error('Dashboard stats error:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch stats',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

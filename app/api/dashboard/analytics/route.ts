import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import prisma from '@/lib/db/prisma'
import { ACHIEVEMENTS, calculateLevel, checkAchievements } from '@/lib/gamification/achievements'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    // Get user stats
    const [
      user,
      totalJobs,
      jobsByDay,
      jobsByTool,
      recentActivity,
      storageUsed
    ] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId } }),
      prisma.processingJob.count({ where: { userId } }),
      prisma.processingJob.groupBy({
        by: ['createdAt'],
        where: { userId, createdAt: { gte: thirtyDaysAgo } },
        _count: true,
        orderBy: { createdAt: 'asc' }
      }),
      prisma.processingJob.groupBy({
        by: ['operationType'],
        where: { userId },
        _count: true,
        orderBy: { _count: { operationType: 'desc' } },
        take: 10
      }),
      prisma.processingJob.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 20,
        select: { id: true, operationType: true, status: true, createdAt: true }
      }),
      prisma.file.aggregate({
        where: { userId },
        _sum: { size: true }
      })
    ])

    // Calculate usage by day for chart
    const dailyUsage: Record<string, number> = {}
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = new Date(now.getTime() - (29 - i) * 24 * 60 * 60 * 1000)
      return date.toISOString().split('T')[0]
    })

    last30Days.forEach(day => { dailyUsage[day] = 0 })
    jobsByDay.forEach((job: any) => {
      const day = new Date(job.createdAt).toISOString().split('T')[0]
      if (dailyUsage[day] !== undefined) {
        dailyUsage[day] += job._count
      }
    })

    // Calculate streak
    let currentStreak = 0
    let longestStreak = 0
    let tempStreak = 0
    const sortedDays = Object.keys(dailyUsage).sort().reverse()

    for (const day of sortedDays) {
      if (dailyUsage[day] > 0) {
        tempStreak++
        if (tempStreak > longestStreak) longestStreak = tempStreak
        if (day === sortedDays[0] || day === sortedDays[1]) {
          currentStreak = tempStreak
        }
      } else {
        if (day !== sortedDays[0]) {
          tempStreak = 0
        }
      }
    }

    // Get unique tools used
    const uniqueTools = [...new Set(jobsByTool.map((j: any) => j.operationType))]

    // Calculate XP (10 XP per file processed)
    const totalXp = totalJobs * 10
    const levelInfo = calculateLevel(totalXp)

    // Get member days
    const memberSinceDays = user?.createdAt
      ? Math.floor((now.getTime() - new Date(user.createdAt).getTime()) / (24 * 60 * 60 * 1000))
      : 0

    // Check achievements
    const userStats = {
      totalFiles: totalJobs,
      currentStreak,
      longestStreak,
      uniqueToolsUsed: uniqueTools,
      totalXp,
      level: levelInfo.level,
      unlockedAchievements: [], // Would load from DB in production
      lastActiveDate: now.toISOString(),
      memberSinceDays,
      largestFileMB: 0
    }

    const earnedAchievements = checkAchievements(userStats)

    // Productivity score (0-100)
    const avgDailyUsage = totalJobs / Math.max(memberSinceDays, 1)
    const productivityScore = Math.min(100, Math.round(avgDailyUsage * 20 + currentStreak * 2 + uniqueTools.length))

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          totalFiles: totalJobs,
          storageUsedMB: Math.round((storageUsed._sum.size || 0) / (1024 * 1024)),
          productivityScore,
          memberSinceDays
        },
        level: {
          current: levelInfo.level,
          xp: levelInfo.currentXp,
          nextLevelXp: levelInfo.nextLevelXp,
          totalXp
        },
        streak: {
          current: currentStreak,
          longest: longestStreak
        },
        charts: {
          dailyUsage: last30Days.map(day => ({ date: day, count: dailyUsage[day] })),
          toolUsage: jobsByTool.map((j: any) => ({ tool: j.operationType, count: j._count }))
        },
        achievements: {
          unlocked: earnedAchievements,
          total: ACHIEVEMENTS.length,
          recent: earnedAchievements.slice(0, 3)
        },
        recentActivity: recentActivity.map(job => ({
          id: job.id,
          tool: job.operationType,
          status: job.status,
          date: job.createdAt
        }))
      }
    })
  } catch (error) {
    console.error('Analytics error:', error)
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 })
  }
}

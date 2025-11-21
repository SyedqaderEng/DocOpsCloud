// Gamification Service - XP, Levels, Streaks, Achievements

import prisma from '@/lib/db/prisma'
import { ACHIEVEMENTS, calculateLevel, Achievement } from './achievements'

// XP rewards for different actions
export const XP_REWARDS = {
  FILE_PROCESSED: 10,
  FIRST_FILE: 50,
  DAILY_LOGIN: 5,
  STREAK_BONUS: 10, // per day of streak
  ACHIEVEMENT_UNLOCK: 0, // defined in achievement
  WORKFLOW_RUN: 15,
  TEAM_INVITE: 20,
} as const

export interface GamificationResult {
  xpEarned: number
  newLevel: boolean
  levelInfo: { level: number; currentXp: number; nextLevelXp: number }
  achievementsUnlocked: Achievement[]
  streakInfo: { current: number; longest: number; isNewDay: boolean }
}

// Award XP to user
export async function awardXP(userId: string, amount: number, reason: string): Promise<void> {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  await prisma.$transaction([
    // Update user stats
    prisma.userStats.upsert({
      where: { user_id: userId },
      update: {
        total_xp: { increment: amount },
      },
      create: {
        user_id: userId,
        total_xp: amount,
      },
    }),
    // Update daily activity
    prisma.dailyActivity.upsert({
      where: { user_id_date: { user_id: userId, date: today } },
      update: {
        xp_earned: { increment: amount },
      },
      create: {
        user_id: userId,
        date: today,
        xp_earned: amount,
      },
    }),
  ])
}

// Process file completion and award rewards
export async function onFileProcessed(userId: string, toolId: string): Promise<GamificationResult> {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Get or create user stats
  let stats = await prisma.userStats.findUnique({
    where: { user_id: userId },
  })

  const isFirstFile = !stats || stats.total_files_processed === 0
  let xpEarned = XP_REWARDS.FILE_PROCESSED

  // First file bonus
  if (isFirstFile) {
    xpEarned += XP_REWARDS.FIRST_FILE
  }

  // Update unique tools used
  const uniqueTools = stats?.unique_tools_used || []
  if (!uniqueTools.includes(toolId)) {
    uniqueTools.push(toolId)
  }

  // Calculate streak
  const lastActive = stats?.last_active_date
  let currentStreak = stats?.current_streak || 0
  let longestStreak = stats?.longest_streak || 0
  let isNewDay = false

  if (lastActive) {
    const lastActiveDate = new Date(lastActive)
    lastActiveDate.setHours(0, 0, 0, 0)
    const daysDiff = Math.floor((today.getTime() - lastActiveDate.getTime()) / (1000 * 60 * 60 * 24))

    if (daysDiff === 1) {
      // Consecutive day
      currentStreak += 1
      isNewDay = true
      xpEarned += XP_REWARDS.STREAK_BONUS * Math.min(currentStreak, 7)
    } else if (daysDiff > 1) {
      // Streak broken
      currentStreak = 1
      isNewDay = true
    }
    // Same day - no streak change
  } else {
    currentStreak = 1
    isNewDay = true
  }

  if (currentStreak > longestStreak) {
    longestStreak = currentStreak
  }

  // Update stats
  stats = await prisma.userStats.upsert({
    where: { user_id: userId },
    update: {
      total_xp: { increment: xpEarned },
      total_operations: { increment: 1 },
      total_files_processed: { increment: 1 },
      current_streak: currentStreak,
      longest_streak: longestStreak,
      last_active_date: today,
      unique_tools_used: uniqueTools,
    },
    create: {
      user_id: userId,
      total_xp: xpEarned,
      total_operations: 1,
      total_files_processed: 1,
      current_streak: currentStreak,
      longest_streak: longestStreak,
      last_active_date: today,
      unique_tools_used: uniqueTools,
    },
  })

  // Update daily activity
  await prisma.dailyActivity.upsert({
    where: { user_id_date: { user_id: userId, date: today } },
    update: {
      operations_count: { increment: 1 },
      files_processed: { increment: 1 },
      xp_earned: { increment: xpEarned },
    },
    create: {
      user_id: userId,
      date: today,
      operations_count: 1,
      files_processed: 1,
      xp_earned: xpEarned,
    },
  })

  // Calculate level
  const levelInfo = calculateLevel(stats.total_xp)
  const previousLevel = stats.level
  const newLevel = levelInfo.level > previousLevel

  if (newLevel) {
    await prisma.userStats.update({
      where: { user_id: userId },
      data: { level: levelInfo.level },
    })
  }

  // Check achievements
  const achievementsUnlocked = await checkAndUnlockAchievements(userId, stats)

  return {
    xpEarned,
    newLevel,
    levelInfo,
    achievementsUnlocked,
    streakInfo: {
      current: currentStreak,
      longest: longestStreak,
      isNewDay,
    },
  }
}

// Check and unlock achievements
async function checkAndUnlockAchievements(userId: string, stats: any): Promise<Achievement[]> {
  const existingAchievements = await prisma.userAchievement.findMany({
    where: { user_id: userId },
    select: { achievement_id: true },
  })

  const unlockedIds = new Set(existingAchievements.map(a => a.achievement_id))
  const newlyUnlocked: Achievement[] = []

  for (const achievement of ACHIEVEMENTS) {
    if (unlockedIds.has(achievement.id)) continue

    let earned = false

    switch (achievement.category) {
      case 'usage':
        earned = stats.total_files_processed >= achievement.requirement
        break
      case 'streak':
        earned = stats.current_streak >= achievement.requirement || stats.longest_streak >= achievement.requirement
        break
      case 'explorer':
        earned = (stats.unique_tools_used?.length || 0) >= achievement.requirement
        break
      case 'power_user':
        // Check for large files - simplified
        earned = stats.total_files_processed >= achievement.requirement * 10
        break
      case 'milestone':
        const memberDays = Math.floor(
          (Date.now() - new Date(stats.created_at).getTime()) / (1000 * 60 * 60 * 24)
        )
        earned = memberDays >= achievement.requirement
        break
    }

    if (earned) {
      await prisma.userAchievement.create({
        data: {
          user_id: userId,
          achievement_id: achievement.id,
          xp_awarded: achievement.xpReward,
        },
      })

      // Award achievement XP
      await prisma.userStats.update({
        where: { user_id: userId },
        data: { total_xp: { increment: achievement.xpReward } },
      })

      newlyUnlocked.push(achievement)
    }
  }

  return newlyUnlocked
}

// Get user gamification data
export async function getUserGamificationData(userId: string) {
  const [stats, achievements, recentActivity] = await Promise.all([
    prisma.userStats.findUnique({
      where: { user_id: userId },
    }),
    prisma.userAchievement.findMany({
      where: { user_id: userId },
      orderBy: { unlocked_at: 'desc' },
    }),
    prisma.dailyActivity.findMany({
      where: { user_id: userId },
      orderBy: { date: 'desc' },
      take: 30,
    }),
  ])

  const levelInfo = calculateLevel(stats?.total_xp || 0)

  return {
    stats: stats || {
      total_xp: 0,
      level: 1,
      current_streak: 0,
      longest_streak: 0,
      total_operations: 0,
      total_files_processed: 0,
      unique_tools_used: [],
    },
    levelInfo,
    achievements: achievements.map(a => ({
      ...ACHIEVEMENTS.find(ach => ach.id === a.achievement_id),
      unlockedAt: a.unlocked_at,
    })),
    recentActivity,
    allAchievements: ACHIEVEMENTS,
  }
}

// Get leaderboard
export async function getLeaderboard(period: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'ALL_TIME', limit = 10) {
  // For simplicity, using UserStats for all-time, can be optimized with Leaderboard table
  const users = await prisma.userStats.findMany({
    orderBy: { total_xp: 'desc' },
    take: limit,
    select: {
      user_id: true,
      total_xp: true,
      level: true,
      current_streak: true,
      total_files_processed: true,
    },
  })

  // Get user details
  const userIds = users.map(u => u.user_id)
  const userDetails = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true, avatar_url: true },
  })

  const userMap = new Map(userDetails.map(u => [u.id, u]))

  return users.map((u, index) => ({
    rank: index + 1,
    userId: u.user_id,
    name: userMap.get(u.user_id)?.name || 'Anonymous',
    avatar: userMap.get(u.user_id)?.avatar_url,
    totalXp: u.total_xp,
    level: u.level,
    streak: u.current_streak,
    filesProcessed: u.total_files_processed,
  }))
}

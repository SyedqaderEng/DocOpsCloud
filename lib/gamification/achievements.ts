// Gamification System - Achievements, Streaks, and Rewards

export interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  category: 'usage' | 'streak' | 'explorer' | 'power_user' | 'milestone'
  requirement: number
  xpReward: number
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
}

export const ACHIEVEMENTS: Achievement[] = [
  // Usage achievements
  { id: 'first_file', name: 'First Steps', description: 'Process your first file', icon: '🎯', category: 'usage', requirement: 1, xpReward: 10, rarity: 'common' },
  { id: 'files_10', name: 'Getting Started', description: 'Process 10 files', icon: '📁', category: 'usage', requirement: 10, xpReward: 50, rarity: 'common' },
  { id: 'files_50', name: 'Regular User', description: 'Process 50 files', icon: '📂', category: 'usage', requirement: 50, xpReward: 100, rarity: 'rare' },
  { id: 'files_100', name: 'Power User', description: 'Process 100 files', icon: '💪', category: 'usage', requirement: 100, xpReward: 250, rarity: 'rare' },
  { id: 'files_500', name: 'Document Master', description: 'Process 500 files', icon: '👑', category: 'usage', requirement: 500, xpReward: 500, rarity: 'epic' },
  { id: 'files_1000', name: 'File Legend', description: 'Process 1000 files', icon: '🏆', category: 'usage', requirement: 1000, xpReward: 1000, rarity: 'legendary' },

  // Streak achievements
  { id: 'streak_3', name: 'Consistent', description: '3-day usage streak', icon: '🔥', category: 'streak', requirement: 3, xpReward: 30, rarity: 'common' },
  { id: 'streak_7', name: 'Week Warrior', description: '7-day usage streak', icon: '⚡', category: 'streak', requirement: 7, xpReward: 100, rarity: 'rare' },
  { id: 'streak_30', name: 'Monthly Champion', description: '30-day usage streak', icon: '🌟', category: 'streak', requirement: 30, xpReward: 500, rarity: 'epic' },
  { id: 'streak_100', name: 'Centurion', description: '100-day usage streak', icon: '💎', category: 'streak', requirement: 100, xpReward: 2000, rarity: 'legendary' },

  // Explorer achievements (using different tools)
  { id: 'tools_5', name: 'Curious Mind', description: 'Try 5 different tools', icon: '🔍', category: 'explorer', requirement: 5, xpReward: 50, rarity: 'common' },
  { id: 'tools_15', name: 'Tool Explorer', description: 'Try 15 different tools', icon: '🧭', category: 'explorer', requirement: 15, xpReward: 150, rarity: 'rare' },
  { id: 'tools_30', name: 'Tool Master', description: 'Try 30 different tools', icon: '🛠️', category: 'explorer', requirement: 30, xpReward: 300, rarity: 'epic' },
  { id: 'tools_all', name: 'Completionist', description: 'Try every tool at least once', icon: '✨', category: 'explorer', requirement: 145, xpReward: 1000, rarity: 'legendary' },

  // Power user achievements (file size)
  { id: 'big_file', name: 'Heavy Lifter', description: 'Process a file over 10MB', icon: '🏋️', category: 'power_user', requirement: 10, xpReward: 50, rarity: 'common' },
  { id: 'huge_file', name: 'Data Giant', description: 'Process a file over 100MB', icon: '🦣', category: 'power_user', requirement: 100, xpReward: 200, rarity: 'rare' },
  { id: 'batch_10', name: 'Batch Processor', description: 'Process 10 files in one session', icon: '⚙️', category: 'power_user', requirement: 10, xpReward: 100, rarity: 'rare' },

  // Milestone achievements
  { id: 'day_1', name: 'Welcome!', description: 'Join DocOpsCloud', icon: '👋', category: 'milestone', requirement: 1, xpReward: 10, rarity: 'common' },
  { id: 'week_1', name: 'One Week In', description: 'Member for 1 week', icon: '📅', category: 'milestone', requirement: 7, xpReward: 25, rarity: 'common' },
  { id: 'month_1', name: 'Monthly Member', description: 'Member for 1 month', icon: '🗓️', category: 'milestone', requirement: 30, xpReward: 100, rarity: 'rare' },
  { id: 'year_1', name: 'Annual Champion', description: 'Member for 1 year', icon: '🎂', category: 'milestone', requirement: 365, xpReward: 1000, rarity: 'legendary' },
]

export interface UserStats {
  totalFiles: number
  currentStreak: number
  longestStreak: number
  uniqueToolsUsed: string[]
  totalXp: number
  level: number
  unlockedAchievements: string[]
  lastActiveDate: string
  memberSinceDays: number
  largestFileMB: number
}

export function calculateLevel(xp: number): { level: number; currentXp: number; nextLevelXp: number } {
  // XP required: Level 1 = 100, Level 2 = 200, etc. (exponential growth)
  let level = 1
  let totalXpNeeded = 0

  while (true) {
    const xpForNextLevel = level * 100
    if (totalXpNeeded + xpForNextLevel > xp) {
      return {
        level,
        currentXp: xp - totalXpNeeded,
        nextLevelXp: xpForNextLevel
      }
    }
    totalXpNeeded += xpForNextLevel
    level++
  }
}

export function checkAchievements(stats: UserStats): Achievement[] {
  const newlyUnlocked: Achievement[] = []

  ACHIEVEMENTS.forEach(achievement => {
    if (stats.unlockedAchievements.includes(achievement.id)) return

    let earned = false

    switch (achievement.category) {
      case 'usage':
        earned = stats.totalFiles >= achievement.requirement
        break
      case 'streak':
        earned = stats.currentStreak >= achievement.requirement || stats.longestStreak >= achievement.requirement
        break
      case 'explorer':
        earned = stats.uniqueToolsUsed.length >= achievement.requirement
        break
      case 'power_user':
        if (achievement.id.includes('file')) {
          earned = stats.largestFileMB >= achievement.requirement
        }
        break
      case 'milestone':
        earned = stats.memberSinceDays >= achievement.requirement
        break
    }

    if (earned) {
      newlyUnlocked.push(achievement)
    }
  })

  return newlyUnlocked
}

export function getLeaderboardRank(xp: number, allUsersXp: number[]): number {
  const sorted = [...allUsersXp].sort((a, b) => b - a)
  return sorted.indexOf(xp) + 1
}

export const RARITY_COLORS = {
  common: '#9ca3af',
  rare: '#3b82f6',
  epic: '#8b5cf6',
  legendary: '#f59e0b'
}

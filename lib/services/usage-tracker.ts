import { prisma } from '@/lib/db/prisma'
import { TIER_LIMITS } from '@/lib/config/constants'
import { SubscriptionTier } from '@prisma/client'

export class UsageTracker {
  /**
   * Check if user can perform an operation based on their plan limits
   */
  static async canPerformOperation(
    userId: string,
    operationType: string
  ): Promise<{ allowed: boolean; reason?: string; remaining?: number }> {
    try {
      // Get user's subscription tier
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          subscription_tier: true,
          subscription_status: true,
        },
      })

      if (!user) {
        return { allowed: false, reason: 'User not found' }
      }

      // Get tier limits
      const tier = user.subscription_tier
      const limits = TIER_LIMITS[tier as keyof typeof TIER_LIMITS]

      // Check if subscription is active (except for FREE tier)
      if (tier !== 'FREE' && user.subscription_status !== 'ACTIVE') {
        return {
          allowed: false,
          reason: 'Subscription is not active. Please update your payment method.',
        }
      }

      // For unlimited tiers, allow immediately
      if (limits.operations_per_month === -1) {
        return { allowed: true }
      }

      // Get current month's usage
      const startOfMonth = new Date()
      startOfMonth.setDate(1)
      startOfMonth.setHours(0, 0, 0, 0)

      const monthlyUsage = await prisma.usageLog.count({
        where: {
          user_id: userId,
          created_at: {
            gte: startOfMonth,
          },
        },
      })

      // Check monthly limit
      if (monthlyUsage >= limits.operations_per_month) {
        return {
          allowed: false,
          reason: `You've reached your monthly limit of ${limits.operations_per_month} operations. Upgrade to continue.`,
          remaining: 0,
        }
      }

      // Check daily limit (for FREE tier)
      if (tier === 'FREE' && limits.operations_per_day) {
        const startOfDay = new Date()
        startOfDay.setHours(0, 0, 0, 0)

        const dailyUsage = await prisma.usageLog.count({
          where: {
            user_id: userId,
            created_at: {
              gte: startOfDay,
            },
          },
        })

        if (dailyUsage >= limits.operations_per_day) {
          return {
            allowed: false,
            reason: `You've reached your daily limit of ${limits.operations_per_day} operations. Try again tomorrow or upgrade to Pro.`,
            remaining: 0,
          }
        }

        return {
          allowed: true,
          remaining: limits.operations_per_day - dailyUsage,
        }
      }

      return {
        allowed: true,
        remaining: limits.operations_per_month - monthlyUsage,
      }
    } catch (error) {
      console.error('Error checking usage limits:', error)
      return { allowed: false, reason: 'Error checking usage limits' }
    }
  }

  /**
   * Record an operation in the usage log
   */
  static async recordOperation(
    userId: string,
    operationType: string,
    fileSize: number = 0,
    processingTimeMs: number = 0
  ): Promise<void> {
    try {
      await prisma.usageLog.create({
        data: {
          user_id: userId,
          operation_type: operationType,
          file_size_processed: BigInt(fileSize),
          processing_time_ms: processingTimeMs,
          credits_used: 1,
        },
      })

      // Also update daily activity for gamification
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      await prisma.dailyActivity.upsert({
        where: {
          user_id_date: {
            user_id: userId,
            date: today,
          },
        },
        create: {
          user_id: userId,
          date: today,
          operations_count: 1,
          files_processed: 1,
          xp_earned: 10, // Base XP per operation
        },
        update: {
          operations_count: {
            increment: 1,
          },
          files_processed: {
            increment: 1,
          },
          xp_earned: {
            increment: 10,
          },
        },
      })
    } catch (error) {
      console.error('Error recording operation:', error)
      throw error
    }
  }

  /**
   * Get user's current usage statistics
   */
  static async getUsageStats(userId: string): Promise<{
    dailyUsage: number
    monthlyUsage: number
    dailyLimit: number
    monthlyLimit: number
    tier: string
  }> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { subscription_tier: true },
      })

      if (!user) {
        throw new Error('User not found')
      }

      const tier = user.subscription_tier
      const limits = TIER_LIMITS[tier as keyof typeof TIER_LIMITS]

      // Get daily usage
      const startOfDay = new Date()
      startOfDay.setHours(0, 0, 0, 0)

      const dailyUsage = await prisma.usageLog.count({
        where: {
          user_id: userId,
          created_at: {
            gte: startOfDay,
          },
        },
      })

      // Get monthly usage
      const startOfMonth = new Date()
      startOfMonth.setDate(1)
      startOfMonth.setHours(0, 0, 0, 0)

      const monthlyUsage = await prisma.usageLog.count({
        where: {
          user_id: userId,
          created_at: {
            gte: startOfMonth,
          },
        },
      })

      return {
        dailyUsage,
        monthlyUsage,
        dailyLimit: limits.operations_per_day || -1,
        monthlyLimit: limits.operations_per_month || -1,
        tier,
      }
    } catch (error) {
      console.error('Error getting usage stats:', error)
      throw error
    }
  }

  /**
   * Check if file size is within user's plan limits
   */
  static async checkFileSize(
    userId: string,
    fileSize: number
  ): Promise<{ allowed: boolean; reason?: string; maxSize?: number }> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { subscription_tier: true },
      })

      if (!user) {
        return { allowed: false, reason: 'User not found' }
      }

      const tier = user.subscription_tier
      const limits = TIER_LIMITS[tier as keyof typeof TIER_LIMITS]

      if (fileSize > limits.max_file_size) {
        return {
          allowed: false,
          reason: `File size exceeds your plan limit of ${this.formatFileSize(limits.max_file_size)}`,
          maxSize: limits.max_file_size,
        }
      }

      return { allowed: true, maxSize: limits.max_file_size }
    } catch (error) {
      console.error('Error checking file size:', error)
      return { allowed: false, reason: 'Error checking file size limits' }
    }
  }

  /**
   * Format file size for display
   */
  private static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes'

    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
  }
}

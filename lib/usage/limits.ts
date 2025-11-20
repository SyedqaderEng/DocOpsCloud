import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db/prisma'
import { TIER_LIMITS } from '@/lib/config/constants'

export interface UsageCheckResult {
  allowed: boolean
  reason?: string
  remaining?: number
  limit?: number
}

/**
 * Check if user can perform an operation based on their subscription tier
 */
export async function checkUsageLimit(userId: string): Promise<UsageCheckResult> {
  try {
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

    // Check subscription status
    if (user.subscription_status !== 'ACTIVE' && user.subscription_tier !== 'FREE') {
      return { allowed: false, reason: 'Subscription inactive. Please update your payment method.' }
    }

    // Get tier limits
    const tier = user.subscription_tier || 'FREE'
    const limits = TIER_LIMITS[tier]

    // Check monthly operations limit
    if (limits.operations_per_month !== -1) {
      const startOfMonth = new Date()
      startOfMonth.setDate(1)
      startOfMonth.setHours(0, 0, 0, 0)

      const operationsThisMonth = await prisma.usageLog.count({
        where: {
          user_id: userId,
          created_at: {
            gte: startOfMonth,
          },
        },
      })

      if (operationsThisMonth >= limits.operations_per_month) {
        return {
          allowed: false,
          reason: `Monthly limit of ${limits.operations_per_month} operations reached. Upgrade to continue.`,
          remaining: 0,
          limit: limits.operations_per_month,
        }
      }

      return {
        allowed: true,
        remaining: limits.operations_per_month - operationsThisMonth,
        limit: limits.operations_per_month,
      }
    }

    // Unlimited operations
    return { allowed: true }
  } catch (error) {
    console.error('Usage check error:', error)
    return { allowed: false, reason: 'Failed to check usage limits' }
  }
}

/**
 * Log usage after successful operation
 */
export async function logUsage(
  userId: string,
  operationType: string,
  fileSizeProcessed: number,
  processingTimeMs: number
) {
  try {
    await prisma.usageLog.create({
      data: {
        user_id: userId,
        operation_type: operationType,
        file_size_processed: BigInt(fileSizeProcessed),
        processing_time_ms: processingTimeMs,
        credits_used: 1,
      },
    })
  } catch (error) {
    console.error('Failed to log usage:', error)
  }
}

/**
 * Get current usage statistics for a user
 */
export async function getUserUsage(userId: string) {
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const [user, operationsThisMonth, totalStorage] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { subscription_tier: true },
    }),
    prisma.usageLog.count({
      where: {
        user_id: userId,
        created_at: { gte: startOfMonth },
      },
    }),
    prisma.file.aggregate({
      where: {
        user_id: userId,
        created_at: { gte: startOfMonth },
      },
      _sum: { file_size: true },
    }),
  ])

  const tier = user?.subscription_tier || 'FREE'
  const limits = TIER_LIMITS[tier]

  return {
    tier,
    operations: {
      used: operationsThisMonth,
      limit: limits.operations_per_month,
      remaining: limits.operations_per_month === -1
        ? -1
        : Math.max(0, limits.operations_per_month - operationsThisMonth),
    },
    storage: {
      used: Number(totalStorage._sum.file_size || 0),
      limit: limits.max_storage,
    },
    features: limits.features,
  }
}

/**
 * Middleware to check usage before processing
 */
export async function withUsageCheck(handler: Function) {
  return async (req: Request) => {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const usageCheck = await checkUsageLimit(session.user.id)

    if (!usageCheck.allowed) {
      return NextResponse.json(
        {
          error: usageCheck.reason,
          remaining: usageCheck.remaining,
          limit: usageCheck.limit,
        },
        { status: 403 }
      )
    }

    // Add usage info to request context
    return handler(req, { usageCheck, userId: session.user.id })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/firebase/admin'
import { prisma } from '@/lib/db/prisma'
import { UsageTracker } from '@/lib/services/usage-tracker'

export interface PlanEnforcementResult {
  allowed: boolean
  reason?: string
  remaining?: number
  shouldUpgrade?: boolean
  tier?: string
}

/**
 * Middleware function to enforce plan limits before operations
 * Use this in API routes before processing files
 */
export async function enforcePlanLimits(
  req: NextRequest,
  options?: {
    operationType?: string
    fileSize?: number
    skipFileCheck?: boolean
  }
): Promise<PlanEnforcementResult> {
  try {
    // Get authorization token
    const authHeader = req.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return {
        allowed: false,
        reason: 'Authentication required',
        shouldUpgrade: false,
      }
    }

    const token = authHeader.split('Bearer ')[1]

    // Verify Firebase token
    let decodedToken
    try {
      decodedToken = await auth.verifyIdToken(token)
    } catch (error) {
      return {
        allowed: false,
        reason: 'Invalid authentication token',
        shouldUpgrade: false,
      }
    }

    // Get user from database
    const user = await prisma.user.findFirst({
      where: {
        email: decodedToken.email,
      },
      select: {
        id: true,
        subscription_tier: true,
        subscription_status: true,
      },
    })

    if (!user) {
      return {
        allowed: false,
        reason: 'User not found',
        shouldUpgrade: false,
      }
    }

    // Check if file size is within limits
    if (options?.fileSize && !options?.skipFileCheck) {
      const fileSizeCheck = await UsageTracker.checkFileSize(user.id, options.fileSize)
      if (!fileSizeCheck.allowed) {
        return {
          allowed: false,
          reason: fileSizeCheck.reason,
          shouldUpgrade: true,
          tier: user.subscription_tier,
        }
      }
    }

    // Check if user can perform operation
    const usageCheck = await UsageTracker.canPerformOperation(
      user.id,
      options?.operationType || 'general'
    )

    if (!usageCheck.allowed) {
      return {
        allowed: false,
        reason: usageCheck.reason,
        remaining: usageCheck.remaining || 0,
        shouldUpgrade: user.subscription_tier === 'FREE',
        tier: user.subscription_tier,
      }
    }

    return {
      allowed: true,
      remaining: usageCheck.remaining,
      tier: user.subscription_tier,
    }
  } catch (error) {
    console.error('Plan enforcement error:', error)
    return {
      allowed: false,
      reason: 'System error checking plan limits',
      shouldUpgrade: false,
    }
  }
}

/**
 * Helper to create standardized error responses
 */
export function createPlanLimitResponse(result: PlanEnforcementResult): NextResponse {
  if (result.shouldUpgrade) {
    return NextResponse.json(
      {
        error: result.reason,
        code: 'PLAN_LIMIT_EXCEEDED',
        shouldUpgrade: true,
        tier: result.tier,
        upgradeUrl: '/pricing',
      },
      { status: 403 }
    )
  }

  return NextResponse.json(
    {
      error: result.reason,
      code: 'UNAUTHORIZED',
    },
    { status: 401 }
  )
}

/**
 * Record successful operation for tracking
 */
export async function recordOperation(
  userId: string,
  operationType: string,
  fileSize: number = 0,
  processingTimeMs: number = 0
): Promise<void> {
  try {
    await UsageTracker.recordOperation(userId, operationType, fileSize, processingTimeMs)
  } catch (error) {
    console.error('Failed to record operation:', error)
    // Don't throw - operation succeeded, just logging failed
  }
}

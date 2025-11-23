// Usage service - re-exports from limits.ts and adds logging
import { prisma } from '@/lib/db/prisma'

export { checkUsageLimit } from './limits'

/**
 * Log a usage event for analytics and billing
 */
export async function logUsage(
  userId: string,
  operation: string,
  metadata?: Record<string, any>
): Promise<void> {
  try {
    await prisma.usageLog.create({
      data: {
        user_id: userId,
        operation,
        metadata: metadata || {},
        created_at: new Date(),
      },
    })
  } catch (error) {
    console.error('Failed to log usage:', error)
    // Don't throw - usage logging shouldn't break the main operation
  }
}

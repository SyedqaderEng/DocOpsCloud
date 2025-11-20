import { auth } from './index'
import { prisma } from '@/lib/db/prisma'
import { SubscriptionTier } from '@prisma/client'

export async function getSession() {
  return await auth()
}

export async function getCurrentUser() {
  const session = await getSession()

  if (!session?.user?.id) {
    return null
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      subscription: true,
    },
  })

  return user
}

export async function requireAuth() {
  const session = await getSession()

  if (!session?.user) {
    throw new Error('Unauthorized')
  }

  return session
}

export async function requireUser() {
  const user = await getCurrentUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  return user
}

export async function checkSubscriptionAccess(requiredTier: SubscriptionTier) {
  const user = await getCurrentUser()

  if (!user) {
    return false
  }

  const tierHierarchy = {
    FREE: 0,
    PRO: 1,
    BUSINESS: 2,
  }

  const userTierLevel = tierHierarchy[user.subscription_tier]
  const requiredTierLevel = tierHierarchy[requiredTier]

  return userTierLevel >= requiredTierLevel
}

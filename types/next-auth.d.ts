import { DefaultSession } from 'next-auth'
import { JWT } from 'next-auth/jwt'
import { SubscriptionTier, SubscriptionStatus } from '@prisma/client'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      subscriptionTier: SubscriptionTier
      subscriptionStatus: SubscriptionStatus
    } & DefaultSession['user']
  }

  interface User {
    subscriptionTier?: SubscriptionTier
    subscriptionStatus?: SubscriptionStatus
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    subscriptionTier?: string
    subscriptionStatus?: string
  }
}
